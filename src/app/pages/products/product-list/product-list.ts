import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { Product } from '../../../models/product';
import { Category } from '../../../models/category';
import { Brand } from '../../../models/brand';
import { Supplier } from '../../../models/supplier';

import { ProductService } from '../../../services/product.service';
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
    private categoryService = inject(CategoryService);
    private brandService = inject(BrandService);
    private supplierService = inject(SupplierService);
    private router = inject(Router);
    private cdr = inject(ChangeDetectorRef);

    products: Product[] = [];
    categories: Category[] = [];
    brands: Brand[] = [];
    suppliers: Supplier[] = [];

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

    ngOnInit(): void {
        this.loadFilters();
        this.loadProducts();
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
