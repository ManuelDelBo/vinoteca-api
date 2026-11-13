import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, Observable, of } from 'rxjs';

import { Product, ProductRequest } from '../../../models/product';
import { PendingProductImage, ProductImage } from '../../../models/product-image';
import { ProductVariant, ProductVariantRequest } from '../../../models/product-variant';
import { Category } from '../../../models/category';
import { Brand } from '../../../models/brand';
import { Supplier } from '../../../models/supplier';

import { ProductService } from '../../../services/product.service';
import { ProductImageService } from '../../../services/product-image.service';
import { ProductVariantService } from '../../../services/product-variant.service';
import { CategoryService } from '../../../services/category.service';
import { BrandService } from '../../../services/brand.service';
import { SupplierService } from '../../../services/supplier.service';

interface VariantForm {
  id?: string;
  attribute: string;
  price: number | null;
  stock: number | null;
  wholesalePrice: number | null;
  wholesaleMinQty: number | null;
  active: boolean;
}

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-form.html',
  styleUrl: './product-form.css'
})
export class ProductForm implements OnInit, OnDestroy {

  private route = inject(ActivatedRoute);
  private router = inject(Router);

  private productService = inject(ProductService);
  private productImageService = inject(ProductImageService);
  private variantService = inject(ProductVariantService);
  private categoryService = inject(CategoryService);
  private brandService = inject(BrandService);
  private supplierService = inject(SupplierService);
  private cdr = inject(ChangeDetectorRef);

  readonly maxImages = 5;

  productId: string | null = null;
  isEditMode = false;
  loading = false;
  saving = false;

  errorMessage = '';
  successMessage = '';

  name = '';
  description = '';
  supplierId = '';
  categoryId = '';
  brandId = '';

  categories: Category[] = [];
  brands: Brand[] = [];
  suppliers: Supplier[] = [];

  variants: VariantForm[] = [];

  existingImages: ProductImage[] = [];
  pendingImages: PendingProductImage[] = [];
  removedImageIds = new Set<string>();

  existingPrincipalId: string | null = null;
  pendingPrincipalIndex: number | null = null;

  ngOnInit(): void {
    this.productId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.productId;

    this.loadOptions();

    if (this.isEditMode && this.productId) {
      this.loadProduct(this.productId);
    } else {
      this.addVariant();
    }
  }

  private loadOptions(): void {
    this.categoryService.getCategories().subscribe({
      next: categories => {
        this.categories = categories.filter(category => category.active);
        this.cdr.markForCheck();
      },
      error: () => {
        this.errorMessage = 'No se pudieron cargar las categorías.';
        this.cdr.markForCheck();
      }
    });

    this.brandService.getBrands().subscribe({
      next: brands => {
        this.brands = brands.filter(brand => brand.active);
        this.cdr.markForCheck();
      },
      error: () => {
        this.errorMessage = 'No se pudieron cargar las marcas.';
        this.cdr.markForCheck();
      }
    });

    this.supplierService.getSuppliers().subscribe({
      next: suppliers => {
        this.suppliers = suppliers.filter(supplier => supplier.active);
        this.cdr.markForCheck();
      },
      error: () => {
        this.errorMessage = 'No se pudieron cargar los proveedores.';
        this.cdr.markForCheck();
      }
    });
  }

  private loadProduct(id: string): void {
    this.loading = true;
    this.errorMessage = '';

    forkJoin({
      product: this.productService.getProductById(id),
      activeVariants: this.variantService.getVariantsByProduct(id),
      inactiveVariants: this.variantService.getInactiveVariantsByProduct(id)
    }).subscribe({
      next: result => {
        const product = result.product;

        this.name = product.name;
        this.description = product.description ?? '';
        this.supplierId = product.supplierId;
        this.categoryId = product.categoryId;
        this.brandId = product.brandId;

        this.variants = [
          ...result.activeVariants.map(variant => this.toVariantForm(variant)),
          ...result.inactiveVariants.map(variant => this.toVariantForm(variant))
        ];

        this.existingImages = product.images ?? [];
        const principal = this.existingImages.find(image => image.principal);
        this.existingPrincipalId = principal?.id ?? this.existingImages[0]?.id ?? null;
        this.pendingPrincipalIndex = null;

        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.errorMessage = 'No se pudo cargar el producto y sus variantes.';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  private toVariantForm(variant: ProductVariant): VariantForm {
    return {
      id: variant.id,
      attribute: variant.attribute,
      price: variant.price,
      stock: variant.stock,
      wholesalePrice: variant.wholesalePrice,
      wholesaleMinQty: variant.wholesaleMinQty,
      active: variant.active
    };
  }

  get visibleExistingImages(): ProductImage[] {
    return this.existingImages.filter(image => !this.removedImageIds.has(image.id));
  }

  get totalImages(): number {
    return this.visibleExistingImages.length + this.pendingImages.length;
  }

  isExistingPrincipal(image: ProductImage): boolean {
    return this.existingPrincipalId === image.id;
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);

    // Permite volver a seleccionar el mismo archivo.
    input.value = '';

    if (files.length === 0) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    const available = this.maxImages - this.totalImages;

    if (available <= 0) {
      this.errorMessage = `Podés cargar hasta ${this.maxImages} imágenes por producto.`;
      this.cdr.markForCheck();
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxFileSize = 5 * 1024 * 1024;

    const selected = files.slice(0, available);
    let invalidType = false;
    let tooLarge = false;

    for (const file of selected) {
      if (!allowedTypes.includes(file.type)) {
        invalidType = true;
        continue;
      }

      if (file.size > maxFileSize) {
        tooLarge = true;
        continue;
      }

      this.pendingImages.push({
        file,
        previewUrl: URL.createObjectURL(file)
      });
    }

    if (
      this.pendingPrincipalIndex === null &&
      !this.existingPrincipalId &&
      this.pendingImages.length > 0
    ) {
      this.pendingPrincipalIndex = 0;
    }

    const messages: string[] = [];

    if (files.length > available) {
      messages.push(`Solo podés cargar hasta ${this.maxImages} imágenes por producto.`);
    }

    if (invalidType) {
      messages.push('Solo se permiten imágenes JPG, JPEG, PNG o WEBP.');
    }

    if (tooLarge) {
      messages.push('Cada imagen debe pesar menos de 5 MB.');
    }

    if (messages.length > 0) {
      this.errorMessage = messages.join(' ');
    }

    this.cdr.markForCheck();
  }

  selectExistingPrincipal(image: ProductImage): void {
    this.existingPrincipalId = image.id;
    this.pendingPrincipalIndex = null;
    this.cdr.markForCheck();
  }

  selectPendingPrincipal(index: number): void {
    this.pendingPrincipalIndex = index;
    this.existingPrincipalId = null;
    this.cdr.markForCheck();
  }

  removeExistingImage(image: ProductImage): void {
    this.errorMessage = '';
    this.successMessage = '';

    const wasPrincipal = this.existingPrincipalId === image.id;
    this.removedImageIds.add(image.id);

    if (wasPrincipal) {
      this.existingPrincipalId = null;

      if (this.pendingImages.length > 0) {
        this.pendingPrincipalIndex = 0;
      } else {
        this.ensureExistingPrincipal();
      }
    }

    this.cdr.markForCheck();
  }

  removePendingImage(index: number): void {
    const [removed] = this.pendingImages.splice(index, 1);

    if (removed) {
      URL.revokeObjectURL(removed.previewUrl);
    }

    const wasPrincipal = this.pendingPrincipalIndex === index;

    if (wasPrincipal) {
      this.pendingPrincipalIndex = this.pendingImages.length > 0
        ? Math.min(index, this.pendingImages.length - 1)
        : null;

      if (this.pendingPrincipalIndex === null) {
        this.ensureExistingPrincipal();
      }
    } else if (this.pendingPrincipalIndex !== null && this.pendingPrincipalIndex > index) {
      this.pendingPrincipalIndex--;
    }

    this.cdr.markForCheck();
  }

  private ensureExistingPrincipal(): void {
    const visible = this.visibleExistingImages;

    if (this.existingPrincipalId && visible.some(image => image.id === this.existingPrincipalId)) {
      return;
    }

    this.existingPrincipalId = visible[0]?.id ?? null;
  }

  private validateImages(): boolean {
    if (this.totalImages === 0) {
      this.errorMessage = 'El producto debe tener al menos una imagen.';
      return false;
    }

    if (this.totalImages > this.maxImages) {
      this.errorMessage = `El producto no puede tener más de ${this.maxImages} imágenes.`;
      return false;
    }

    const hasPrincipal = this.pendingPrincipalIndex !== null
      ? this.pendingPrincipalIndex >= 0 && this.pendingPrincipalIndex < this.pendingImages.length
      : !!this.existingPrincipalId &&
      this.visibleExistingImages.some(image => image.id === this.existingPrincipalId);

    if (!hasPrincipal) {
      this.errorMessage = 'Seleccioná cuál será la imagen principal del producto.';
      return false;
    }

    return true;
  }

  private clearPendingImages(): void {
    this.pendingImages.forEach(image => URL.revokeObjectURL(image.previewUrl));
    this.pendingImages = [];
    this.pendingPrincipalIndex = null;
  }

  ngOnDestroy(): void {
    this.clearPendingImages();
  }

  addVariant(): void {
    this.variants.push({
      attribute: '',
      price: null,
      stock: 0,
      wholesalePrice: null,
      wholesaleMinQty: null,
      active: true
    });
  }

  removeNewVariant(index: number): void {
    const variant = this.variants[index];

    if (variant.id) {
      return;
    }

    this.variants.splice(index, 1);
  }

  disableVariant(variant: VariantForm): void {
    if (!variant.id || !variant.active) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    this.variantService.deleteVariant(variant.id).subscribe({
      next: () => {
        variant.active = false;
        this.successMessage = 'Variante deshabilitada correctamente.';
        this.cdr.markForCheck();
      },
      error: () => {
        this.errorMessage = 'No se pudo deshabilitar la variante.';
        this.cdr.markForCheck();
      }
    });
  }

  activateVariant(variant: VariantForm): void {
    if (!variant.id || variant.active) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    this.variantService.activateVariant(variant.id).subscribe({
      next: () => {
        variant.active = true;
        this.successMessage = 'Variante reactivada correctamente.';
        this.cdr.markForCheck();
      },
      error: () => {
        this.errorMessage = 'No se pudo reactivar la variante.';
        this.cdr.markForCheck();
      }
    });
  }

  saveProduct(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.validateProduct()) {
      return;
    }

    if (!this.validateVariants()) {
      return;
    }

    if (!this.validateImages()) {
      return;
    }

    const request: ProductRequest = {
      name: this.name.trim(),
      description: this.description.trim() || null,
      supplierId: this.supplierId,
      categoryId: this.categoryId,
      brandId: this.brandId
    };

    this.saving = true;

    if (this.isEditMode && this.productId) {
      this.updateProduct(request);
    } else {
      this.createProduct(request);
    }
  }

  private validateProduct(): boolean {
    if (!this.name.trim()) {
      this.errorMessage = 'Ingresá el nombre del producto.';
      return false;
    }

    if (!this.supplierId || !this.categoryId || !this.brandId) {
      this.errorMessage = 'Seleccioná un proveedor, una categoría y una marca.';
      return false;
    }

    return true;
  }

  private validateVariants(): boolean {
    const activeVariants = this.variants.filter(variant => variant.active);

    if (activeVariants.length === 0) {
      this.errorMessage = 'El producto debe tener al menos una variante activa.';
      return false;
    }

    for (const variant of activeVariants) {
      if (!variant.attribute.trim()) {
        this.errorMessage = 'Completá el atributo de todas las variantes activas.';
        return false;
      }

      if (variant.price === null || variant.price <= 0) {
        this.errorMessage = 'El precio de cada variante debe ser mayor a cero.';
        return false;
      }

      if (variant.stock === null || variant.stock < 0) {
        this.errorMessage = 'El stock no puede ser negativo.';
        return false;
      }

      const hasWholesalePrice = variant.wholesalePrice !== null;
      const hasWholesaleMinQty = variant.wholesaleMinQty !== null;

      if (hasWholesalePrice !== hasWholesaleMinQty) {
        this.errorMessage = 'Para configurar el precio mayorista, completá también la cantidad mínima.';
        return false;
      }

      if (hasWholesalePrice && hasWholesaleMinQty) {
        if (variant.wholesalePrice! <= 0 || variant.wholesaleMinQty! < 1) {
          this.errorMessage = 'El precio mayorista y la cantidad mínima deben ser válidos.';
          return false;
        }

        if (variant.wholesalePrice! >= variant.price) {
          this.errorMessage = 'El precio mayorista debe ser menor al precio regular.';
          return false;
        }
      }
    }

    return true;
  }

  private createProduct(request: ProductRequest): void {
    this.productService.createProduct(request).subscribe({
      next: product => {
        // A partir de acá el producto ya existe: si algo falla, el usuario
        // puede reintentar desde el modo edición sin duplicarlo.
        this.productId = product.id;
        this.isEditMode = true;

        this.persistImages(product.id, () => this.createVariants(product.id));
      },
      error: () => {
        this.errorMessage = 'No se pudo crear el producto.';
        this.saving = false;
        this.cdr.markForCheck();
      }
    });
  }

  private updateProduct(request: ProductRequest): void {
    this.productService.updateProduct(this.productId!, request).subscribe({
      next: () => {
        this.persistImages(this.productId!, () => this.saveVariants(this.productId!));
      },
      error: () => {
        this.errorMessage = 'No se pudo actualizar el producto.';
        this.saving = false;
        this.cdr.markForCheck();
      }
    });
  }

  private persistImages(productId: string, onSuccess: () => void): void {
    const upload$ = this.pendingImages.length > 0
      ? this.productImageService.uploadImages(
        productId,
        this.pendingImages.map(image => image.file)
      )
      : of([] as ProductImage[]);

    upload$.subscribe({
      next: uploaded => {
        const pendingPrincipalId = this.pendingPrincipalIndex !== null
          ? uploaded[this.pendingPrincipalIndex]?.id ?? null
          : null;

        if (uploaded.length > 0) {
          this.existingImages = [...this.existingImages, ...uploaded];

          if (pendingPrincipalId) {
            this.existingPrincipalId = pendingPrincipalId;
          }
        }

        this.clearPendingImages();

        const idsToDelete = [...this.removedImageIds];
        const delete$ = idsToDelete.length > 0
          ? forkJoin(idsToDelete.map(id => this.productImageService.deleteImage(productId, id)))
          : of([]);

        delete$.subscribe({
          next: () => {
            const principalId = this.existingPrincipalId;
            const principal$: Observable<ProductImage | null> = principalId
              ? this.productImageService.setPrincipal(productId, principalId)
              : of(null);

            principal$.subscribe({
              next: () => this.reloadImages(productId, onSuccess),
              error: () => this.handleImageError('No se pudo establecer la imagen principal.')
            });
          },
          error: () => this.handleImageError('No se pudieron eliminar las imágenes seleccionadas.')
        });
      },
      error: () => this.handleImageError('No se pudieron subir las imágenes.')
    });
  }

  private reloadImages(productId: string, onSuccess: () => void): void {
    this.productImageService.getImages(productId).subscribe({
      next: images => {
        this.existingImages = images;
        this.removedImageIds.clear();

        const principal = images.find(image => image.principal);
        this.existingPrincipalId = principal?.id ?? images[0]?.id ?? null;
        this.pendingPrincipalIndex = null;

        this.cdr.markForCheck();
        onSuccess();
      },
      error: () => {
        // Las imágenes ya se guardaron correctamente; continuamos con el flujo.
        this.removedImageIds.clear();
        this.cdr.markForCheck();
        onSuccess();
      }
    });
  }

  private handleImageError(message: string): void {
    this.errorMessage = message;
    this.saving = false;
    this.cdr.markForCheck();
  }

  private createVariants(productId: string): void {
    const activeVariants = this.variants.filter(variant => variant.active);

    const requests = activeVariants.map(variant =>
      this.variantService.createVariant(this.toVariantRequest(variant, productId))
    );

    if (requests.length === 0) {
      this.saving = false;
      this.router.navigate(['/management/products']);
      return;
    }

    forkJoin(requests).subscribe({
      next: () => {
        this.saving = false;
        this.router.navigate(['/management/products']);
      },
      error: () => {
        this.errorMessage = 'El producto se creó, pero ocurrió un error al guardar alguna variante.';
        this.saving = false;
        this.cdr.markForCheck();
      }
    });
  }

  private saveVariants(productId: string): void {
    const requests = this.variants
      .filter(variant => variant.active)
      .map(variant => {
        const request = this.toVariantRequest(variant, productId);

        return variant.id
          ? this.variantService.updateVariant(variant.id, request)
          : this.variantService.createVariant(request);
      });

    if (requests.length === 0) {
      this.saving = false;
      this.router.navigate(['/management/products']);
      return;
    }

    forkJoin(requests).subscribe({
      next: () => {
        this.saving = false;
        this.router.navigate(['/management/products']);
      },
      error: () => {
        this.errorMessage = 'El producto se actualizó, pero ocurrió un error al guardar alguna variante.';
        this.saving = false;
        this.cdr.markForCheck();
      }
    });
  }

  private toVariantRequest(
    variant: VariantForm,
    productId: string
  ): ProductVariantRequest {
    return {
      attribute: variant.attribute.trim(),
      price: variant.price!,
      stock: variant.stock!,
      wholesalePrice: variant.wholesalePrice,
      wholesaleMinQty: variant.wholesaleMinQty,
      productId
    };
  }

  cancel(): void {
    this.router.navigate(['/management/products']);
  }
}
