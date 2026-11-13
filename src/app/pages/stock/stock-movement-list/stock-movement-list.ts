import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

import { Brand } from '../../../models/brand';
import { Category } from '../../../models/category';
import { Product } from '../../../models/product';
import { ProductVariant } from '../../../models/product-variant';
import { StockMovement, StockMovementRequest, StockMovementType } from '../../../models/stock-movement';
import { Supplier } from '../../../models/supplier';

import { AuthService } from '../../../services/auth.service';
import { BrandService } from '../../../services/brand.service';
import { CategoryService } from '../../../services/category.service';
import { ProductService } from '../../../services/product.service';
import { ProductVariantService } from '../../../services/product-variant.service';
import { StockMovementService } from '../../../services/stock-movement.service';
import { SupplierService } from '../../../services/supplier.service';

import { ConfirmDialog } from '../../../shared/confirm-dialog/confirm-dialog';

const LOW_STOCK_THRESHOLD = 10;
const REASON_MIN_LENGTH = 10;
const REASON_MAX_LENGTH = 500;

type StockSortOrder = 'asc' | 'desc';

interface StockRow {
    variant: ProductVariant;
    productName: string;
    categoryId: string;
    categoryName: string;
    brandId: string;
    brandName: string;
    supplierId: string;
    supplierName: string;
}

interface AdjustForm {
    desiredStock: number | null;
    reason: string;
}

@Component({
    selector: 'app-stock-movement-list',
    imports: [CommonModule, FormsModule, ConfirmDialog],
    templateUrl: './stock-movement-list.html',
    styleUrl: './stock-movement-list.css'
})
export class StockMovementList implements OnInit {

    private productService = inject(ProductService);
    private variantService = inject(ProductVariantService);
    private stockMovementService = inject(StockMovementService);
    private categoryService = inject(CategoryService);
    private brandService = inject(BrandService);
    private supplierService = inject(SupplierService);
    private authService = inject(AuthService);
    private cdr = inject(ChangeDetectorRef);

    private allRows: StockRow[] = [];

    rows: StockRow[] = [];
    categories: Category[] = [];
    brands: Brand[] = [];
    suppliers: Supplier[] = [];

    searchName = '';
    searchUuid = '';
    selectedCategory = '';
    selectedBrand = '';
    selectedSupplier = '';
    sortOrder: StockSortOrder = 'asc';

    loading = false;
    errorMessage = '';
    successMessage = '';

    copiedId = '';
    private copiedTimer: ReturnType<typeof setTimeout> | null = null;

    adjustTarget: StockRow | null = null;
    adjustForm: AdjustForm = { desiredStock: null, reason: '' };
    adjustError = '';
    adjusting = false;
    pendingAdjustment = false;

    historyTarget: StockRow | null = null;
    movements: StockMovement[] = [];
    historyLoading = false;
    historyError = '';

    ngOnInit(): void {
        this.loadData();
    }

    get canAdjustStock(): boolean {
        return this.authService.hasPermission('STOCK_ADJUSTMENT');
    }

    get canViewMovements(): boolean {
        return this.authService.hasPermission('STOCK_MOVEMENT_LIST_BY_VARIANT');
    }

    get lowStockCount(): number {
        return this.allRows.filter(row => this.isLowStock(row)).length;
    }

    get hasVariants(): boolean {
        return this.allRows.length > 0;
    }

    get adjustDelta(): number | null {
        if (!this.adjustTarget || this.adjustForm.desiredStock == null) {
            return null;
        }

        return this.adjustForm.desiredStock - this.adjustTarget.variant.stock;
    }

    get adjustDeltaLabel(): string {
        const delta = this.adjustDelta;

        if (delta == null || Number.isNaN(delta)) {
            return '—';
        }

        return delta > 0 ? `+${delta}` : `${delta}`;
    }

    get confirmationMessage(): string {
        if (!this.adjustTarget) {
            return '';
        }

        return `${this.adjustTarget.productName} · ${this.adjustTarget.variant.attribute}: el stock pasará de ${this.adjustTarget.variant.stock} a ${this.adjustForm.desiredStock} unidad(es).`;
    }

    get confirmationDetail(): string {
        return `Diferencia: ${this.adjustDeltaLabel} unidad(es). Motivo: ${this.adjustForm.reason.trim()}`;
    }

    loadData(): void {
        this.loading = true;
        this.errorMessage = '';
        this.successMessage = '';

        forkJoin({
            variants: this.variantService.searchVariants(),
            products: this.productService.getProducts(),
            categories: this.categoryService.getCategories(),
            brands: this.brandService.getBrands(),
            suppliers: this.supplierService.getSuppliers()
        }).subscribe({
            next: ({ variants, products, categories, brands, suppliers }) => {
                const productsById = new Map(products.map(product => [product.id, product]));

                this.allRows = variants.map(variant =>
                    this.buildRow(variant, productsById.get(variant.productId))
                );

                this.categories = categories.filter(category => category.active);
                this.brands = brands.filter(brand => brand.active);
                this.suppliers = suppliers.filter(supplier => supplier.active);

                this.loading = false;
                this.applyFilters();
                this.cdr.detectChanges();
            },
            error: error => {
                console.error('Error loading stock:', error);
                this.errorMessage = this.extractError(error, 'No se pudo cargar el stock de las variantes.');
                this.loading = false;
                this.cdr.detectChanges();
            }
        });
    }

    private buildRow(variant: ProductVariant, product?: Product): StockRow {
        return {
            variant,
            productName: variant.productName || product?.name || 'Producto sin nombre',
            categoryId: product?.categoryId ?? '',
            categoryName: product?.categoryName ?? '',
            brandId: product?.brandId ?? '',
            brandName: product?.brandName ?? '',
            supplierId: product?.supplierId ?? '',
            supplierName: product?.supplierName ?? ''
        };
    }

    applyFilters(): void {
        const name = this.searchName.trim().toLowerCase();
        const uuid = this.searchUuid.trim().toLowerCase();
        const direction = this.sortOrder === 'desc' ? -1 : 1;

        const filtered = this.allRows.filter(row => {
            if (name) {
                const matchesName = row.productName.toLowerCase().includes(name)
                    || row.variant.attribute.toLowerCase().includes(name);

                if (!matchesName) {
                    return false;
                }
            }

            if (uuid && !row.variant.id.toLowerCase().includes(uuid)) {
                return false;
            }

            if (this.selectedCategory && row.categoryId !== this.selectedCategory) {
                return false;
            }

            if (this.selectedBrand && row.brandId !== this.selectedBrand) {
                return false;
            }

            if (this.selectedSupplier && row.supplierId !== this.selectedSupplier) {
                return false;
            }

            return true;
        });

        filtered.sort((a, b) => {
            // Las variantes con stock bajo siempre van primero, sin importar el orden elegido.
            const lowA = this.isLowStock(a) ? 0 : 1;
            const lowB = this.isLowStock(b) ? 0 : 1;

            if (lowA !== lowB) {
                return lowA - lowB;
            }

            const stockDiff = (a.variant.stock - b.variant.stock) * direction;

            if (stockDiff !== 0) {
                return stockDiff;
            }

            const nameDiff = a.productName.localeCompare(b.productName);

            return nameDiff !== 0
                ? nameDiff
                : a.variant.attribute.localeCompare(b.variant.attribute);
        });

        this.rows = filtered;
    }

    clearFilters(): void {
        this.searchName = '';
        this.searchUuid = '';
        this.selectedCategory = '';
        this.selectedBrand = '';
        this.selectedSupplier = '';
        this.sortOrder = 'asc';
        this.applyFilters();
    }

    isLowStock(row: StockRow): boolean {
        return row.variant.stock < LOW_STOCK_THRESHOLD;
    }

    isOutOfStock(row: StockRow): boolean {
        return row.variant.stock <= 0;
    }

    shortVariantId(id: string): string {
        return id ? `${id.slice(0, 8)}…` : '';
    }

    copyVariantId(id: string, event?: Event): void {
        event?.stopPropagation();

        const markCopied = () => {
            this.copiedId = id;

            if (this.copiedTimer) {
                clearTimeout(this.copiedTimer);
            }

            this.copiedTimer = setTimeout(() => {
                if (this.copiedId === id) {
                    this.copiedId = '';
                    this.cdr.detectChanges();
                }
            }, 1800);

            this.cdr.detectChanges();
        };

        if (navigator.clipboard?.writeText) {
            navigator.clipboard.writeText(id).then(markCopied).catch(() => {
                this.fallbackCopy(id, markCopied);
            });

            return;
        }

        this.fallbackCopy(id, markCopied);
    }

    private fallbackCopy(text: string, onCopied: () => void): void {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();

        try {
            document.execCommand('copy');
            onCopied();
        } catch (error) {
            console.error('No se pudo copiar el ID:', error);
        } finally {
            document.body.removeChild(textarea);
        }
    }

    openAdjustModal(row: StockRow): void {
        this.adjustTarget = row;
        this.adjustForm = {
            desiredStock: row.variant.stock,
            reason: ''
        };
        this.adjustError = '';
        this.pendingAdjustment = false;
    }

    onDesiredStockChange(value: number | null): void {
        this.adjustForm.desiredStock = value;
        this.adjustError = '';
    }

    onReasonChange(value: string): void {
        this.adjustForm.reason = value;
        this.adjustError = '';
    }

    closeAdjustModal(): void {
        if (this.adjusting) {
            return;
        }

        this.adjustTarget = null;
        this.pendingAdjustment = false;
        this.adjustError = '';
    }

    submitAdjustment(): void {
        const error = this.validateAdjustment();

        if (error) {
            this.adjustError = error;
            return;
        }

        this.adjustError = '';
        this.pendingAdjustment = true;
    }

    cancelAdjustmentConfirmation(): void {
        if (this.adjusting) {
            return;
        }

        this.pendingAdjustment = false;
    }

    executeAdjustment(): void {
        if (!this.adjustTarget || this.adjusting) {
            return;
        }

        const target = this.adjustTarget;
        const delta = this.adjustDelta;

        if (delta == null || delta === 0) {
            this.pendingAdjustment = false;
            this.adjustError = 'El nuevo stock es igual al actual. No hay cambios para guardar.';
            return;
        }

        const request: StockMovementRequest = {
            quantity: delta,
            reason: this.adjustForm.reason.trim(),
            variantId: target.variant.id
        };

        this.adjusting = true;

        this.variantService.adjustStock(request).subscribe({
            next: updatedVariant => {
                const row = this.allRows.find(item => item.variant.id === updatedVariant.id);

                if (row) {
                    row.variant = updatedVariant;
                }

                this.adjusting = false;
                this.pendingAdjustment = false;
                this.adjustTarget = null;
                this.successMessage = row
                    ? `Stock de "${row.productName} · ${row.variant.attribute}" actualizado a ${updatedVariant.stock} unidad(es).`
                    : 'Stock actualizado correctamente.';

                this.applyFilters();
                this.cdr.detectChanges();
            },
            error: error => {
                console.error('Error adjusting stock:', error);
                this.adjusting = false;
                this.pendingAdjustment = false;
                this.adjustError = this.extractError(error, 'No se pudo ajustar el stock de la variante.');
                this.cdr.detectChanges();
            }
        });
    }

    private validateAdjustment(): string {
        if (!this.adjustTarget) {
            return 'No se seleccionó una variante.';
        }

        const desired = this.adjustForm.desiredStock;

        if (desired == null || Number.isNaN(Number(desired))) {
            return 'Ingresá el nuevo stock deseado.';
        }

        if (!Number.isInteger(Number(desired))) {
            return 'El stock debe ser un número entero.';
        }

        if (Number(desired) < 0) {
            return 'El stock no puede ser negativo.';
        }

        if (Number(desired) === this.adjustTarget.variant.stock) {
            return 'El nuevo stock es igual al actual. No hay cambios para guardar.';
        }

        const reason = this.adjustForm.reason.trim();

        if (reason.length < REASON_MIN_LENGTH || reason.length > REASON_MAX_LENGTH) {
            return `El motivo es obligatorio y debe tener entre ${REASON_MIN_LENGTH} y ${REASON_MAX_LENGTH} caracteres.`;
        }

        return '';
    }

    openHistory(row: StockRow): void {
        this.historyTarget = row;
        this.movements = [];
        this.historyError = '';
        this.historyLoading = true;

        this.stockMovementService.getByVariant(row.variant.id).subscribe({
            next: movements => {
                this.movements = movements;
                this.historyLoading = false;
                this.cdr.detectChanges();
            },
            error: error => {
                console.error('Error loading stock movements:', error);
                this.historyError = this.extractError(error, 'No se pudieron cargar los movimientos de la variante.');
                this.historyLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    closeHistory(): void {
        this.historyTarget = null;
        this.movements = [];
        this.historyError = '';
        this.historyLoading = false;
    }

    movementTypeLabel(type: StockMovementType): string {
        switch (type) {
            case 'ENTRY':
                return 'Entrada';
            case 'SALE':
                return 'Venta';
            case 'CANCELLATION':
                return 'Cancelación';
            case 'ADJUSTMENT':
                return 'Ajuste';
            default:
                return type;
        }
    }

    movementTypeClass(type: StockMovementType): string {
        switch (type) {
            case 'ENTRY':
                return 'entry';
            case 'SALE':
                return 'sale';
            case 'CANCELLATION':
                return 'cancellation';
            case 'ADJUSTMENT':
                return 'adjustment';
            default:
                return '';
        }
    }

    movementSignedQuantity(movement: StockMovement): number {
        switch (movement.type) {
            case 'ENTRY':
            case 'CANCELLATION':
                return Math.abs(movement.quantity);
            case 'SALE':
                return -Math.abs(movement.quantity);
            case 'ADJUSTMENT':
                return movement.quantity;
            default:
                return movement.quantity;
        }
    }

    movementQuantityLabel(movement: StockMovement): string {
        const quantity = this.movementSignedQuantity(movement);

        return quantity > 0 ? `+${quantity}` : `${quantity}`;
    }

    movementQuantityClass(movement: StockMovement): string {
        const quantity = this.movementSignedQuantity(movement);

        if (quantity > 0) {
            return 'positive';
        }

        if (quantity < 0) {
            return 'negative';
        }

        return 'neutral';
    }

    trackByVariantId(_index: number, row: StockRow): string {
        return row.variant.id;
    }

    trackByMovementId(_index: number, movement: StockMovement): string {
        return movement.id;
    }

    private extractError(error: any, fallback: string): string {
        if (error?.status === 403) {
            return 'No tenés permisos para realizar esta operación.';
        }

        const backendError = error?.error;

        if (typeof backendError === 'string' && backendError.trim()) {
            return backendError;
        }

        const message = backendError?.message ?? backendError?.error ?? backendError?.detail;

        if (typeof message === 'string' && message.trim()) {
            return message;
        }

        return fallback;
    }
}
