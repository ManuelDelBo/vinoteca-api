import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ProductVariant } from '../../../models/product-variant';
import { Product } from '../../../models/product';
import { Category } from '../../../models/category';
import { Brand } from '../../../models/brand';
import { Supplier } from '../../../models/supplier';

import { ProductService } from '../../../services/product.service';
import { ProductVariantService } from '../../../services/product-variant.service';
import { CategoryService } from '../../../services/category.service';
import { BrandService } from '../../../services/brand.service';
import { SupplierService } from '../../../services/supplier.service';

@Component({
    selector: 'app-product-list',
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './product-list.html',
    styleUrl: './product-list.css'
})
export class ProductList implements OnInit {

    private productService = inject(ProductService);
    private productVariantService = inject(ProductVariantService);
    private categoryService = inject(CategoryService);
    private brandService = inject(BrandService);
    private supplierService = inject(SupplierService);
    private router = inject(Router);
    private cdr = inject(ChangeDetectorRef);

    products: Product[] = [];
    variants: ProductVariant[] = [];
    categories: Category[] = [];
    brands: Brand[] = [];
    suppliers: Supplier[] = [];
    currentPage = 1;
    pageSize = 12;
    sortBy = 'name-asc';

    searchName = '';
    selectedCategory = '';
    selectedBrand = '';
    selectedSupplier = '';

    showingInactive = false;
    loading = false;
    errorMessage = '';
    successMessage = '';

    get isManagement(): boolean {
        return this.router.url.startsWith('/management');
    }

    getMinPrice(productId: string): number | null {
        const prices = this.variants
            .filter(variant =>
                variant.productId === productId &&
                variant.active
            )
            .map(variant => variant.price)
            .filter(price => Number.isFinite(price) && price >= 0);

        return prices.length > 0
            ? Math.min(...prices)
            : null;
    }

    get sortedProducts(): Product[] {
        const sorted = [...this.products];

        switch (this.sortBy) {
            case 'name-asc':
                return sorted.sort((a, b) =>
                    a.name.localeCompare(b.name, 'es')
                );

            case 'name-desc':
                return sorted.sort((a, b) =>
                    b.name.localeCompare(a.name, 'es')
                );

            case 'price-asc':
            case 'price-desc':
                return sorted.sort((a, b) => {
                    const priceA = this.getMinPrice(a.id);
                    const priceB = this.getMinPrice(b.id);

                    if (priceA === null) return priceB === null ? 0 : 1;
                    if (priceB === null) return -1;

                    return this.sortBy === 'price-asc'
                        ? priceA - priceB
                        : priceB - priceA;
                });

            default:
                return sorted;
        }
    }

    get totalPages(): number {
    return Math.ceil(this.products.length / this.pageSize);
    }

   get paginatedProducts(): Product[] {
        const start = (this.currentPage - 1) * this.pageSize;

        return this.sortedProducts.slice(
            start,
            start + this.pageSize
        );
    }

    ngOnInit(): void {
        this.loadFilters();
        this.loadProducts();
        this.loadVariants();
    }

    loadFilters(): void {
        this.categoryService.getCategories().subscribe({
            next: categories => this.categories = categories.filter(c => c.active)
        });

        this.brandService.getBrands().subscribe({
            next: brands => this.brands = brands.filter(b => b.active)
        });

        this.supplierService.getSuppliers().subscribe({
            next: suppliers => this.suppliers = suppliers.filter(s => s.active)
        });
    }

    loadVariants(): void {
        this.productVariantService.searchVariants().subscribe({
            next: variants => {
                this.variants = variants.filter(variant => variant.active);
                this.cdr.detectChanges();
            },
            error: error => {
                console.error('Error loading variants:', error);
                this.variants = [];
                this.errorMessage = 'No se pudieron cargar los precios de los productos.';
                this.cdr.detectChanges();
            }
        });
    }

    loadProducts(): void {
        this.loading = true;
        this.errorMessage = '';
        this.successMessage = '';

        const filters = {
            name: this.searchName.trim() || undefined,
            categoryId: this.selectedCategory || undefined,
            brandId: this.selectedBrand || undefined,
            supplierId: this.selectedSupplier || undefined
        };

        const request = this.showingInactive
            ? this.productService.getInactiveProducts(filters)
            : this.productService.getProducts(filters);

        request.subscribe({
            next: products => {
                this.products = products;
                this.currentPage = 1;
                this.loading = false;
                this.cdr.detectChanges();
            },
            error: error => {
                console.error('Error loading products:', error);
                this.errorMessage = 'No se pudieron cargar los productos.';
                this.loading = false;
                this.cdr.detectChanges();
            }
        });
    }

    search(): void {
        this.loadProducts();
    }

    changePage(page: number): void {
    if (page < 1 || page > this.totalPages) {
        return;
    }

    this.currentPage = page;
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
    }

    changeSort(): void {
        this.currentPage = 1;
    }

    toggleInactive(): void {
        this.showingInactive = !this.showingInactive;
        this.loadProducts();
    }

    clearFilters(): void {
        this.searchName = '';
        this.selectedCategory = '';
        this.selectedBrand = '';
        this.selectedSupplier = '';
        this.loadProducts();
    }

    viewProduct(product: Product): void {
        const path = this.isManagement
            ? ['/management/products', product.id]
            : ['/products', product.id];

        this.router.navigate(path);
    }

    editProduct(product: Product): void {
        this.router.navigate(['/management/products', product.id, 'edit']);
    }

    createProduct(): void {
        this.router.navigate(['/management/products/new']);
    }

    deleteProduct(product: Product): void {
        const confirmed = confirm(
            `¿Querés deshabilitar el producto "${product.name}"? También se deshabilitarán sus variantes activas.`
        );

        if (!confirmed) return;

        this.productService.deleteProduct(product.id).subscribe({
            next: response => {
                const variantsCount = response.disabledVariants?.length ?? 0;

                this.successMessage = variantsCount > 0
                    ? `Producto deshabilitado. También se deshabilitaron ${variantsCount} variante(s).`
                    : 'Producto deshabilitado correctamente.';

                this.loadProducts();
            },
            error: error => {
                console.error('Error disabling product:', error);
                this.errorMessage = 'No se pudo deshabilitar el producto.';
            }
        });
    }

    activateProduct(product: Product): void {
        const confirmed = confirm(
            `¿Querés volver a activar el producto "${product.name}"?`
        );

        if (!confirmed) return;

        this.productService.activateProduct(product.id).subscribe({
            next: () => {
                this.successMessage = 'Producto activado correctamente.';
                this.loadProducts();
            },
            error: error => {
                console.error('Error activating product:', error);
                this.errorMessage =
                    'No se pudo activar el producto. Verificá que su proveedor, categoría y marca estén activos.';
            }
        });
    }
}
