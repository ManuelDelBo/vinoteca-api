import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';

import { Product } from '../../../models/product';
import { Category } from '../../../models/category';
import { Brand } from '../../../models/brand';
import { Supplier } from '../../../models/supplier';

import { ProductService } from '../../../services/product.service';
import { CategoryService } from '../../../services/category.service';
import { BrandService } from '../../../services/brand.service';
import { SupplierService } from '../../../services/supplier.service';
import { ModalService } from '../../../shared/modal/modal.service';

@Component({
    selector: 'app-product-list',
    imports: [CommonModule, FormsModule],
    templateUrl: './product-list.html',
    styleUrl: './product-list.css'
})
export class ProductList implements OnInit {

    private productService = inject(ProductService);
    private categoryService = inject(CategoryService);
    private brandService = inject(BrandService);
    private supplierService = inject(SupplierService);
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private cdr = inject(ChangeDetectorRef);
    private modal = inject(ModalService);

    products: Product[] = [];
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

    contextNames = {
        category: '',
        brand: '',
        supplier: ''
    };

    showingInactive = false;
    loading = false;
    errorMessage = '';
    successMessage = '';

    private ignoreQueryChange = false;

    get isManagement(): boolean {
        return this.router.url.startsWith('/management');
    }

    get hasEntityFilter(): boolean {
        return !!this.selectedCategory || !!this.selectedBrand || !!this.selectedSupplier;
    }

    get contextLabel(): string {
        const parts: string[] = [];

        if (this.selectedCategory) {
            parts.push(`Categoría: ${this.categoryName()}`);
        }

        if (this.selectedBrand) {
            parts.push(`Marca: ${this.brandName()}`);
        }

        if (this.selectedSupplier) {
            parts.push(`Proveedor: ${this.supplierName()}`);
        }

        return parts.join(' · ');
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
                    const priceA = a.minPrice;
                    const priceB = b.minPrice;

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
        this.applyQueryParams(this.route.snapshot.queryParamMap);

        this.route.queryParamMap.subscribe(params => {
            if (this.ignoreQueryChange) {
                this.ignoreQueryChange = false;
                return;
            }

            const categoryChanged = params.get('categoryId') !== this.selectedCategory;
            const brandChanged = params.get('brandId') !== this.selectedBrand;
            const supplierChanged = params.get('supplierId') !== this.selectedSupplier;

            this.applyQueryParams(params);

            if (categoryChanged || brandChanged || supplierChanged) {
                this.loadProducts();
            }
        });

        this.loadFilters();

        this.route.queryParamMap.subscribe(params => {
            this.searchName = params.get('name') ?? '';
            this.selectedCategory = params.get('categoryId') ?? '';
            this.selectedBrand = params.get('brandId') ?? '';
            this.selectedSupplier = params.get('supplierId') ?? '';

            this.loadProducts();
        });
    }

    loadFilters(): void {
        this.categoryService.getCategories().subscribe({
            next: categories => {
                this.categories = categories.filter(c => c.active);
                this.syncContextNames();
                this.cdr.markForCheck();
            },
            error: () => {
                // Un invitado no tiene permisos de gestión: el catálogo
                // sigue funcionando sin este filtro.
                this.categories = [];
                this.cdr.markForCheck();
            }
        });

        this.brandService.getBrands().subscribe({
            next: brands => {
                this.brands = brands.filter(b => b.active);
                this.syncContextNames();
                this.cdr.markForCheck();
            },
            error: () => {
                this.brands = [];
                this.cdr.markForCheck();
            }
        });

        this.supplierService.getSuppliers().subscribe({
            next: suppliers => {
                this.suppliers = suppliers.filter(s => s.active);
                this.syncContextNames();
                this.cdr.markForCheck();
            },
            error: () => {
                this.suppliers = [];
                this.cdr.markForCheck();
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
                this.cdr.markForCheck();
            },
            error: error => {
                console.error('Error loading products:', error);
                this.errorMessage = 'No se pudieron cargar los productos.';
                this.loading = false;
                this.cdr.markForCheck();
            }
        });
    }

    search(): void {
        this.syncContextNames();
        this.updateQueryParams();
        this.loadProducts();
    }

    onFilterChange(): void {
        this.syncContextNames();
        this.updateQueryParams();
        this.loadProducts();
    }

    removeContextFilter(): void {
        this.selectedCategory = '';
        this.selectedBrand = '';
        this.selectedSupplier = '';
        this.contextNames = { category: '', brand: '', supplier: '' };
        this.updateQueryParams();
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
        this.contextNames = { category: '', brand: '', supplier: '' };
        this.updateQueryParams();
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

    async deleteProduct(product: Product): Promise<void> {
        const confirmed = await this.modal.confirm({
            title: 'Deshabilitar producto',
            message: `¿Querés deshabilitar el producto "${product.name}"?`,
            detail: 'También se deshabilitarán sus variantes activas.',
            confirmLabel: 'Deshabilitar',
            cancelLabel: 'Cancelar',
            variant: 'danger'
        });

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

    async activateProduct(product: Product): Promise<void> {
        const confirmed = await this.modal.confirm({
            title: 'Activar producto',
            message: `¿Querés volver a activar el producto "${product.name}"?`,
            confirmLabel: 'Activar',
            cancelLabel: 'Cancelar',
            variant: 'confirm'
        });

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

    private applyQueryParams(params: ParamMap): void {
        this.selectedCategory = params.get('categoryId') ?? '';
        this.selectedBrand = params.get('brandId') ?? '';
        this.selectedSupplier = params.get('supplierId') ?? '';

        this.contextNames = {
            category: params.get('categoryName') ?? '',
            brand: params.get('brandName') ?? '',
            supplier: params.get('supplierName') ?? ''
        };
    }

    private updateQueryParams(): void {
        const queryParams: Record<string, string> = {};

        if (this.selectedCategory) {
            queryParams['categoryId'] = this.selectedCategory;
            if (this.contextNames.category) {
                queryParams['categoryName'] = this.contextNames.category;
            }
        }

        if (this.selectedBrand) {
            queryParams['brandId'] = this.selectedBrand;
            if (this.contextNames.brand) {
                queryParams['brandName'] = this.contextNames.brand;
            }
        }

        if (this.selectedSupplier) {
            queryParams['supplierId'] = this.selectedSupplier;
            if (this.contextNames.supplier) {
                queryParams['supplierName'] = this.contextNames.supplier;
            }
        }

        if (this.searchName.trim()) {
            queryParams['name'] = this.searchName.trim();
        }

        this.ignoreQueryChange = true;

        this.router.navigate([], {
            relativeTo: this.route,
            queryParams,
            replaceUrl: true
        }).then(() => {
            this.ignoreQueryChange = false;
        }).catch(() => {
            this.ignoreQueryChange = false;
        });
    }

    private syncContextNames(): void {
        if (this.selectedCategory) {
            const category = this.categories.find(item => item.id === this.selectedCategory);
            this.contextNames.category = category?.name ?? this.contextNames.category;
        }

        if (this.selectedBrand) {
            const brand = this.brands.find(item => item.id === this.selectedBrand);
            this.contextNames.brand = brand?.name ?? this.contextNames.brand;
        }

        if (this.selectedSupplier) {
            const supplier = this.suppliers.find(item => item.id === this.selectedSupplier);
            this.contextNames.supplier = supplier?.name ?? this.contextNames.supplier;
        }
    }

    private categoryName(): string {
        return this.categories.find(item => item.id === this.selectedCategory)?.name
            ?? this.contextNames.category
            ?? 'Categoría seleccionada';
    }

    private brandName(): string {
        return this.brands.find(item => item.id === this.selectedBrand)?.name
            ?? this.contextNames.brand
            ?? 'Marca seleccionada';
    }

    private supplierName(): string {
        return this.suppliers.find(item => item.id === this.selectedSupplier)?.name
            ?? this.contextNames.supplier
            ?? 'Proveedor seleccionado';
    }
}
