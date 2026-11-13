import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';

import { ConfirmDialog } from '../../../shared/confirm-dialog/confirm-dialog';

import { Product } from '../../../models/product';
import { ProductVariant, ProductVariantRequest } from '../../../models/product-variant';
import { CartItemRequest } from '../../../models/cart';

import { ProductService } from '../../../services/product.service';
import { ProductVariantService } from '../../../services/product-variant.service';
import { CartService } from '../../../services/cart.service';
import { AuthService } from '../../../services/auth.service';

interface VariantEditForm {
  attribute: string;
  price: number | null;
  stock: number | null;
  wholesalePrice: number | null;
  wholesaleMinQty: number | null;
}

type PendingConfirmation =
  | { type: 'delete-product' }
  | { type: 'activate-product' }
  | { type: 'delete-variant'; variant: ProductVariant }
  | { type: 'activate-variant'; variant: ProductVariant };

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmDialog],
  styleUrl: './product-detail.css',
  templateUrl: './product-detail.html',
})
export class ProductDetail implements OnInit {

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productService = inject(ProductService);
  private variantService = inject(ProductVariantService);
  private cartService = inject(CartService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  product: Product | null = null;
  activeVariants: ProductVariant[] = [];
  inactiveVariants: ProductVariant[] = [];

  selectedImageUrl: string | null = null;

  loading = false;
  variantsLoading = false;
  errorMessage = '';
  successMessage = '';

  selectedVariantId: string | null = null;
  quantity = 1;
  addingToCart = false;
  cartMessage = '';
  cartError = '';

  editingVariant: ProductVariant | null = null;
  pendingConfirmation: PendingConfirmation | null = null;
  variantForm: VariantEditForm = this.emptyVariantForm();
  savingVariant = false;
  variantError = '';
  deletingVariantId: string | null = null;
  activatingVariantId: string | null = null;

  deletingProduct = false;
  activatingProduct = false;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.errorMessage = 'No se encontró el producto solicitado.';
      return;
    }

    this.loadProduct(id);
  }

  // ---------------------------------------------------------------------------
  // Rol y permisos
  // ---------------------------------------------------------------------------

  get isStaff(): boolean {
    return this.authService.hasRole('ROLE_ADMIN') ||
      this.authService.hasRole('ROLE_EMPLOYEE');
  }

  get isCustomer(): boolean {
    return this.authService.hasRole('ROLE_CUSTOMER');
  }

  get canBuy(): boolean {
    return this.isCustomer &&
      this.authService.hasPermission('CART_CREATE_OR_UPDATE');
  }

  get canEditProduct(): boolean {
    return this.authService.hasPermission('PRODUCT_UPDATE');
  }

  get canDeleteProduct(): boolean {
    return this.authService.hasPermission('PRODUCT_DELETE');
  }

  get canActivateProduct(): boolean {
    return this.authService.hasPermission('PRODUCT_ACTIVATE');
  }

  get canEditVariant(): boolean {
    return this.authService.hasPermission('PRODUCT_VARIANT_UPDATE');
  }

  get canDeleteVariant(): boolean {
    return this.authService.hasPermission('PRODUCT_VARIANT_DELETE');
  }

  get canActivateVariant(): boolean {
    return this.authService.hasPermission('PRODUCT_VARIANT_ACTIVATE');
  }

  get isManagementRoute(): boolean {
    return this.router.url.startsWith('/management');
  }

  get backRoute(): string {
    return this.isStaff || this.isManagementRoute
      ? '/management/products'
      : '/products';
  }

  // ---------------------------------------------------------------------------
  // Carga de datos
  // ---------------------------------------------------------------------------

  private loadProduct(id: string): void {
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.productService.getProductById(id).subscribe({
      next: product => {
        this.setProduct(product);
        this.loading = false;

        if (this.canBuy || this.isStaff) {
          this.loadVariants(product.id);
        }

        this.cdr.markForCheck();
      },
      error: error => {
        if (error?.status === 404 && this.isStaff) {
          this.loadInactiveProduct(id);
          return;
        }

        this.errorMessage = 'No se pudo cargar el producto.';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  private loadInactiveProduct(id: string): void {
    this.productService.getInactiveProductById(id).subscribe({
      next: product => {
        this.setProduct(product);
        this.loading = false;

        if (this.canBuy || this.isStaff) {
          this.loadVariants(product.id);
        }

        this.cdr.markForCheck();
      },
      error: () => {
        this.errorMessage = 'No se pudo cargar el producto.';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  private setProduct(product: Product): void {
    this.product = product;
    this.selectedImageUrl = this.resolveInitialImage(product);
    this.quantity = 1;
    this.selectedVariantId = null;
    this.cartMessage = '';
    this.cartError = '';
  }

  private loadVariants(productId: string): void {
    this.variantsLoading = true;

    const activeRequest = this.variantService.getVariantsByProduct(productId);

    if (this.isStaff) {
      forkJoin({
        active: activeRequest,
        inactive: this.variantService.getInactiveVariantsByProduct(productId)
      }).subscribe({
        next: result => {
          this.activeVariants = result.active;
          this.inactiveVariants = result.inactive;
          this.variantsLoading = false;
          this.keepSelectionIfValid();
          this.cdr.markForCheck();
        },
        error: () => {
          this.activeVariants = [];
          this.inactiveVariants = [];
          this.variantsLoading = false;
          this.errorMessage = 'No se pudieron cargar las variantes del producto.';
          this.cdr.markForCheck();
        }
      });

      return;
    }

    activeRequest.subscribe({
      next: variants => {
        this.activeVariants = variants;
        this.inactiveVariants = [];
        this.variantsLoading = false;
        this.keepSelectionIfValid();
        this.cdr.markForCheck();
      },
      error: () => {
        this.activeVariants = [];
        this.inactiveVariants = [];
        this.variantsLoading = false;
        this.errorMessage = 'No se pudieron cargar las variantes del producto.';
        this.cdr.markForCheck();
      }
    });
  }

  private keepSelectionIfValid(): void {
    if (!this.selectedVariantId) {
      return;
    }

    const exists = this.activeVariants.some(
      variant => variant.id === this.selectedVariantId
    );

    if (!exists) {
      this.selectedVariantId = null;
      this.quantity = 1;
    }
  }

  private resolveInitialImage(product: Product): string | null {
    const principal = product.images.find(image => image.principal);

    if (principal) {
      return principal.url;
    }

    if (product.principalImagePath) {
      return product.principalImagePath;
    }

    return product.images[0]?.url ?? null;
  }

  // ---------------------------------------------------------------------------
  // Galería
  // ---------------------------------------------------------------------------

  get galleryUrls(): string[] {
    if (!this.product) {
      return [];
    }

    const urls = this.product.images
      .map(image => image.url)
      .filter(url => !!url);

    if (urls.length === 0 && this.product.principalImagePath) {
      return [this.product.principalImagePath];
    }

    return urls;
  }

  selectImage(url: string): void {
    this.selectedImageUrl = url;
    this.cdr.markForCheck();
  }

  // ---------------------------------------------------------------------------
  // Variantes visibles
  // ---------------------------------------------------------------------------

  get allVariants(): ProductVariant[] {
    return [...this.activeVariants, ...this.inactiveVariants];
  }

  trackByVariantId(_index: number, variant: ProductVariant): string {
    return variant.id;
  }

  hasWholesalePrice(variant: ProductVariant): boolean {
    return variant.wholesalePrice != null && variant.wholesaleMinQty != null;
  }

  // ---------------------------------------------------------------------------
  // Compra
  // ---------------------------------------------------------------------------

  get selectedVariant(): ProductVariant | null {
    return this.activeVariants.find(
      variant => variant.id === this.selectedVariantId
    ) ?? null;
  }

  get selectedStock(): number {
    return this.selectedVariant?.stock ?? 0;
  }

  get isWholesaleApplied(): boolean {
    const variant = this.selectedVariant;

    if (!variant || variant.wholesalePrice == null || variant.wholesaleMinQty == null) {
      return false;
    }

    return this.quantity >= variant.wholesaleMinQty;
  }

  get unitPrice(): number {
    const variant = this.selectedVariant;

    if (!variant) {
      return 0;
    }

    if (this.isWholesaleApplied) {
      return Number(variant.wholesalePrice);
    }

    return Number(variant.price);
  }

  get subtotal(): number {
    return this.unitPrice * this.quantity;
  }

  get canAddToCart(): boolean {
    return !!this.selectedVariant &&
      this.selectedStock > 0 &&
      this.quantity > 0 &&
      Number.isInteger(this.quantity) &&
      this.quantity <= this.selectedStock &&
      !this.addingToCart;
  }

  selectVariant(variant: ProductVariant): void {
    if (variant.stock <= 0) {
      return;
    }

    this.selectedVariantId = variant.id;
    this.quantity = 1;
    this.cartError = '';
    this.cartMessage = '';
    this.cdr.markForCheck();
  }

  onQuantityChange(): void {
    if (!Number.isFinite(this.quantity) || this.quantity < 1) {
      this.quantity = 1;
    }

    this.cartError = '';
    this.cdr.markForCheck();
  }

  addToCart(): void {
    this.cartError = '';
    this.cartMessage = '';

    const variant = this.selectedVariant;

    if (!variant) {
      this.cartError = 'Seleccioná una variante antes de agregar al carrito.';
      this.cdr.markForCheck();
      return;
    }

    if (variant.stock <= 0) {
      this.cartError = 'La variante seleccionada no tiene stock disponible.';
      this.cdr.markForCheck();
      return;
    }

    if (!Number.isInteger(this.quantity) || this.quantity <= 0) {
      this.cartError = 'La cantidad debe ser un número entero mayor a cero.';
      this.cdr.markForCheck();
      return;
    }

    if (this.quantity > variant.stock) {
      this.cartError = `Solo hay ${variant.stock} unidad(es) disponibles de esta variante.`;
      this.cdr.markForCheck();
      return;
    }

    this.addingToCart = true;

    this.cartService.getCartOrNull().subscribe({
      next: cart => {
        const items: CartItemRequest[] = (cart?.cartItems ?? []).map(item => ({
          productVariantId: item.productVariantId,
          quantity: item.quantity
        }));

        const existing = items.find(item => item.productVariantId === variant.id);
        const newQuantity = (existing?.quantity ?? 0) + this.quantity;

        if (newQuantity > variant.stock) {
          this.addingToCart = false;
          this.cartError = existing
            ? `Ya tenés ${existing.quantity} unidad(es) en el carrito y solo hay ${variant.stock} disponibles.`
            : `Solo hay ${variant.stock} unidad(es) disponibles de esta variante.`;
          this.cdr.markForCheck();
          return;
        }

        if (existing) {
          existing.quantity = newQuantity;
        } else {
          items.push({
            productVariantId: variant.id,
            quantity: this.quantity
          });
        }

        this.cartService.createOrUpdateCart(items).subscribe({
          next: () => {
            this.addingToCart = false;
            this.cartMessage = `Se agregó "${variant.attribute}" al carrito.`;
            this.cdr.markForCheck();
          },
          error: error => {
            this.addingToCart = false;
            this.cartError = this.resolveCartError(error);
            this.cdr.markForCheck();
          }
        });
      },
      error: error => {
        this.addingToCart = false;
        this.cartError = this.resolveCartError(error);
        this.cdr.markForCheck();
      }
    });
  }

  private resolveCartError(error: any): string {
    const backendMessage = typeof error?.error === 'string'
      ? error.error
      : error?.error?.message;

    if (error?.status === 409) {
      if (typeof backendMessage === 'string' &&
        backendMessage.toLowerCase().includes('stock')) {
        return 'No hay stock suficiente para la cantidad solicitada.';
      }

      if (typeof backendMessage === 'string' &&
        backendMessage.toLowerCase().includes('not active')) {
        return 'La variante o el producto ya no está disponible para la venta.';
      }
    }

    if (typeof backendMessage === 'string' && backendMessage.trim()) {
      return backendMessage;
    }

    return 'No se pudo agregar el producto al carrito.';
  }

  // ---------------------------------------------------------------------------
  // Acciones administrativas
  // ---------------------------------------------------------------------------

  goBack(): void {
    this.router.navigate([this.backRoute]);
  }

  editProduct(): void {
    if (!this.product || !this.product.active) {
      return;
    }

    this.router.navigate(['/management/products', this.product.id, 'edit']);
  }

  deleteProduct(): void {
    if (!this.product || !this.canDeleteProduct || this.deletingProduct) {
      return;
    }

    this.pendingConfirmation = { type: 'delete-product' };
    this.cdr.markForCheck();
  }

  private confirmDeleteProduct(): void {
    if (!this.product || !this.canDeleteProduct || this.deletingProduct) {
      return;
    }

    this.deletingProduct = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.cdr.markForCheck();

    this.productService.deleteProduct(this.product.id).subscribe({
      next: response => {
        const variantsCount = response.disabledVariants?.length ?? 0;

        if (this.product) {
          this.product.active = false;
        }

        this.deletingProduct = false;
        this.successMessage = variantsCount > 0
          ? `Producto deshabilitado. También se deshabilitaron ${variantsCount} variante(s).`
          : 'Producto deshabilitado correctamente.';

        this.loadVariants(this.product!.id);
        this.cdr.markForCheck();
      },
      error: error => {
        this.deletingProduct = false;
        this.errorMessage = this.resolveError(error, 'No se pudo deshabilitar el producto.');
        this.cdr.markForCheck();
      }
    });
  }

  activateProduct(): void {
    if (!this.product || this.product.active || this.activatingProduct) {
      return;
    }

    this.pendingConfirmation = { type: 'activate-product' };
    this.cdr.markForCheck();
  }

  private confirmActivateProduct(): void {
    if (!this.product || this.product.active || this.activatingProduct) {
      return;
    }

    this.activatingProduct = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.cdr.markForCheck();

    this.productService.activateProduct(this.product.id).subscribe({
      next: () => {
        if (this.product) {
          this.product.active = true;
        }

        this.activatingProduct = false;
        this.successMessage = 'Producto activado correctamente. Las variantes continúan inactivas hasta reactivarlas.';
        this.loadVariants(this.product!.id);
        this.cdr.markForCheck();
      },
      error: error => {
        this.activatingProduct = false;
        this.errorMessage = this.resolveError(
          error,
          'No se pudo activar el producto. Verificá que su proveedor, categoría y marca estén activos.'
        );
        this.cdr.markForCheck();
      }
    });
  }

  editVariant(variant: ProductVariant): void {
    if (!variant.active || !this.canEditVariant) {
      return;
    }

    this.editingVariant = variant;
    this.variantForm = {
      attribute: variant.attribute,
      price: Number(variant.price),
      stock: variant.stock,
      wholesalePrice: variant.wholesalePrice != null ? Number(variant.wholesalePrice) : null,
      wholesaleMinQty: variant.wholesaleMinQty
    };
    this.variantError = '';
    this.cdr.markForCheck();
  }

  cancelEditVariant(): void {
    if (this.savingVariant) {
      return;
    }

    this.editingVariant = null;
    this.variantError = '';
    this.cdr.markForCheck();
  }

  saveVariant(): void {
    const variant = this.editingVariant;

    if (!variant || !this.product || this.savingVariant) {
      return;
    }

    const error = this.validateVariantForm();

    if (error) {
      this.variantError = error;
      this.cdr.markForCheck();
      return;
    }

    const request: ProductVariantRequest = {
      attribute: this.variantForm.attribute.trim(),
      price: Number(this.variantForm.price),
      stock: Number(this.variantForm.stock),
      wholesalePrice: this.variantForm.wholesalePrice != null
        ? Number(this.variantForm.wholesalePrice)
        : null,
      wholesaleMinQty: this.variantForm.wholesaleMinQty,
      productId: this.product.id
    };

    this.savingVariant = true;
    this.variantError = '';
    this.cdr.markForCheck();

    this.variantService.updateVariant(variant.id, request).subscribe({
      next: () => {
        this.savingVariant = false;
        this.editingVariant = null;
        this.successMessage = 'Variante actualizada correctamente.';
        this.loadVariants(this.product!.id);
        this.cdr.markForCheck();
      },
      error: error => {
        this.savingVariant = false;
        this.variantError = this.resolveError(error, 'No se pudo actualizar la variante.');
        this.cdr.markForCheck();
      }
    });
  }

  private validateVariantForm(): string {
    const form = this.variantForm;

    if (!form.attribute.trim()) {
      return 'Ingresá el atributo o descripción de la variante.';
    }

    if (form.price == null || Number(form.price) <= 0) {
      return 'El precio de venta debe ser mayor a cero.';
    }

    if (form.stock == null || Number(form.stock) < 0 || !Number.isInteger(Number(form.stock))) {
      return 'El stock debe ser un número entero mayor o igual a cero.';
    }

    const hasWholesalePrice = form.wholesalePrice != null;
    const hasWholesaleMinQty = form.wholesaleMinQty != null;

    if (hasWholesalePrice !== hasWholesaleMinQty) {
      return 'Completá el precio mayorista y la cantidad mínima mayorista juntos.';
    }

    if (hasWholesalePrice && hasWholesaleMinQty) {
      if (Number(form.wholesalePrice) <= 0) {
        return 'El precio mayorista debe ser mayor a cero.';
      }

      if (Number(form.wholesaleMinQty) < 1 || !Number.isInteger(Number(form.wholesaleMinQty))) {
        return 'La cantidad mínima mayorista debe ser un entero mayor o igual a 1.';
      }

      if (Number(form.wholesalePrice) >= Number(form.price)) {
        return 'El precio mayorista debe ser menor que el precio de venta.';
      }
    }

    return '';
  }

  deleteVariant(variant: ProductVariant): void {
    if (!variant.active || !this.canDeleteVariant || this.deletingVariantId) {
      return;
    }

    this.pendingConfirmation = { type: 'delete-variant', variant };
    this.cdr.markForCheck();
  }

  private confirmDeleteVariant(variant: ProductVariant): void {
    this.deletingVariantId = variant.id;
    this.errorMessage = '';
    this.successMessage = '';
    this.cdr.markForCheck();

    this.variantService.deleteVariant(variant.id).subscribe({
      next: () => {
        this.deletingVariantId = null;
        this.successMessage = 'Variante deshabilitada correctamente.';
        this.loadVariants(this.product!.id);
        this.cdr.markForCheck();
      },
      error: error => {
        this.deletingVariantId = null;
        this.errorMessage = this.resolveError(error, 'No se pudo deshabilitar la variante.');
        this.cdr.markForCheck();
      }
    });
  }

  activateVariant(variant: ProductVariant): void {
    if (variant.active || !this.canActivateVariant || this.activatingVariantId) {
      return;
    }

    if (!this.product?.active) {
      this.errorMessage = 'Para reactivar una variante, primero reactivá el producto.';
      this.cdr.markForCheck();
      return;
    }

    this.pendingConfirmation = { type: 'activate-variant', variant };
    this.cdr.markForCheck();
  }

  private confirmActivateVariant(variant: ProductVariant): void {
    this.activatingVariantId = variant.id;
    this.errorMessage = '';
    this.successMessage = '';
    this.cdr.markForCheck();

    this.variantService.activateVariant(variant.id).subscribe({
      next: () => {
        this.activatingVariantId = null;
        this.successMessage = 'Variante reactivada correctamente.';
        this.loadVariants(this.product!.id);
        this.cdr.markForCheck();
      },
      error: error => {
        this.activatingVariantId = null;
        this.errorMessage = this.resolveError(error, 'No se pudo reactivar la variante.');
        this.cdr.markForCheck();
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Confirmación (diálogo de acciones destructivas/reactivables)
  // ---------------------------------------------------------------------------

  cancelPendingConfirmation(): void {
    this.pendingConfirmation = null;
    this.cdr.markForCheck();
  }

  executePendingConfirmation(): void {
    const pending = this.pendingConfirmation;

    if (!pending) {
      return;
    }

    this.pendingConfirmation = null;

    switch (pending.type) {
      case 'delete-product':
        this.confirmDeleteProduct();
        break;
      case 'activate-product':
        this.confirmActivateProduct();
        break;
      case 'delete-variant':
        this.confirmDeleteVariant(pending.variant);
        break;
      case 'activate-variant':
        this.confirmActivateVariant(pending.variant);
        break;
    }
  }

  get confirmationBusy(): boolean {
    return this.deletingProduct || this.activatingProduct ||
      !!this.deletingVariantId || !!this.activatingVariantId;
  }

  get confirmationTitle(): string {
    switch (this.pendingConfirmation?.type) {
      case 'delete-product': return 'Eliminar producto';
      case 'activate-product': return 'Reactivar producto';
      case 'delete-variant': return 'Eliminar variante';
      case 'activate-variant': return 'Reactivar variante';
      default: return '';
    }
  }

  get confirmationMessage(): string {
    const pending = this.pendingConfirmation;

    if (!pending) {
      return '';
    }

    switch (pending.type) {
      case 'delete-product':
        return `¿Querés deshabilitar el producto "${this.product?.name ?? ''}"? También se deshabilitarán sus variantes activas.`;
      case 'activate-product':
        return `¿Querés volver a activar el producto "${this.product?.name ?? ''}"?`;
      case 'delete-variant':
        return `¿Querés deshabilitar la variante "${pending.variant.attribute}"?`;
      case 'activate-variant':
        return `¿Querés volver a activar la variante "${pending.variant.attribute}"?`;
    }
  }

  get confirmationDetail(): string {
    const pending = this.pendingConfirmation;

    if (!pending) {
      return '';
    }

    switch (pending.type) {
      case 'delete-product':
        return 'El producto seguirá disponible en el historial, pero no podrá venderse.';
      case 'delete-variant':
        return 'La variante dejará de estar disponible para la venta.';
      default:
        return '';
    }
  }

  get confirmationWarning(): string {
    const pending = this.pendingConfirmation;

    if (!pending) {
      return '';
    }

    switch (pending.type) {
      case 'delete-product':
        return 'Si continuás, también se desactivarán todas las variantes activas del producto.';
      case 'delete-variant':
        return 'Si continuás, la variante quedará deshabilitada (eliminación lógica).';
      default:
        return '';
    }
  }

  get confirmationLabel(): string {
    const pending = this.pendingConfirmation;

    if (!pending) {
      return '';
    }

    switch (pending.type) {
      case 'delete-product':
      case 'delete-variant':
        return 'Eliminar';
      case 'activate-product':
      case 'activate-variant':
        return 'Reactivar';
    }
  }

  private resolveError(error: any, fallback: string): string {
    if (typeof error?.error === 'string' && error.error.trim()) {
      return error.error;
    }

    return error?.error?.message || fallback;
  }

  private emptyVariantForm(): VariantEditForm {
    return {
      attribute: '',
      price: null,
      stock: null,
      wholesalePrice: null,
      wholesaleMinQty: null
    };
  }
}
