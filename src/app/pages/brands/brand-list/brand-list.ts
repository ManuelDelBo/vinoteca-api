import { ChangeDetectorRef, Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ConfirmDialog } from '../../../shared/confirm-dialog/confirm-dialog';
import { ModalService } from '../../../shared/modal/modal.service';
import { BrandService } from '../../../services/brand.service';
import { Brand } from '../../../models/brand';

interface PendingDeletion {
    id: string;
    name: string;
    count: number;
}

@Component({
    imports: [RouterLink, ConfirmDialog],
    selector: 'app-brand-list',
    styleUrl: './brand-list.css',
    templateUrl: './brand-list.html'
})
export class BrandList implements OnInit {

    brands = signal<Brand[]>([]);
    inactiveBrands = signal<Brand[]>([]);
    mostrarInactivas = signal<boolean>(false);
    mensaje = signal<string>('');
    pendingDeletion = signal<PendingDeletion | null>(null);
    checkingDeletion = signal<boolean>(false);
    deleting = signal<boolean>(false);

    constructor(
        private brandService: BrandService,
        private modal: ModalService,
        private cdr: ChangeDetectorRef
    ) {}

    ngOnInit(): void {
        this.loadBrands();
    }

    loadBrands(): void {
        this.brandService.getBrands().subscribe(data => {
            this.brands.set(data);
            this.cdr.markForCheck();
        });
    }

    requestDelete(brand: Brand): void {
        if (this.checkingDeletion() || this.deleting()) {
            return;
        }

        this.mensaje.set('');
        this.checkingDeletion.set(true);
        this.cdr.markForCheck();

        this.brandService.getRelatedProductCount(brand.id).subscribe({
            next: async ({ count }) => {
                this.checkingDeletion.set(false);

                if (count <= 0) {
                    const confirmar = await this.modal.confirm({
                        title: 'Eliminar marca',
                        message: `¿Estás seguro de que querés eliminar la marca "${brand.name}"?`,
                        confirmLabel: 'Eliminar',
                        cancelLabel: 'Cancelar',
                        variant: 'danger'
                    });

                    if (confirmar) {
                        this.performDelete(brand.id, false);
                    } else {
                        this.cdr.markForCheck();
                    }

                    return;
                }

                this.pendingDeletion.set({
                    id: brand.id,
                    name: brand.name,
                    count
                });
                this.cdr.markForCheck();
            },
            error: () => {
                this.checkingDeletion.set(false);
                this.mensaje.set('No se pudo verificar si la marca tiene productos asociados.');
                this.cdr.markForCheck();
            }
        });
    }

    deleteMessage(pending: PendingDeletion): string {
        return `¿Estás seguro de que querés eliminar la marca "${pending.name}"?`;
    }

    deleteDetail(pending: PendingDeletion): string {
        const productos = pending.count === 1 ? 'producto asociado' : 'productos asociados';
        return `Esta marca tiene ${pending.count} ${productos}.`;
    }

    confirmCascadeDelete(): void {
        const pending = this.pendingDeletion();

        if (!pending) {
            return;
        }

        this.performDelete(pending.id, true);
    }

    cancelDelete(): void {
        if (this.deleting()) {
            return;
        }

        this.pendingDeletion.set(null);
        this.cdr.markForCheck();
    }

    private performDelete(id: string, cascade: boolean): void {
        this.mensaje.set('');
        this.deleting.set(true);
        this.cdr.markForCheck();

        this.brandService.deleteBrand(id).subscribe({
            next: () => {
                this.deleting.set(false);
                this.pendingDeletion.set(null);
                this.mensaje.set(
                    cascade
                        ? 'Marca eliminada. También se desactivaron sus productos y variantes.'
                        : 'Marca eliminada correctamente.'
                );
                this.loadBrands();
                this.cdr.markForCheck();
            },
            error: (error) => {
                this.deleting.set(false);
                this.pendingDeletion.set(null);
                this.mensaje.set(this.resolveError(error, 'No se pudo eliminar la marca.'));
                this.cdr.markForCheck();
            }
        });
    }

    private resolveError(error: any, fallback: string): string {
        if (typeof error?.error === 'string' && error.error.trim()) {
            return error.error;
        }

        return error?.error?.message || fallback;
    }

    loadInactiveBrands(): void {
        this.brandService.getInactiveBrands().subscribe(data => {
            this.inactiveBrands.set(data);
            this.cdr.markForCheck();
        });
    }

    toggleInactiveBrands(): void {
        this.mostrarInactivas.update(valor => !valor);

        if (this.mostrarInactivas()) {
            this.loadInactiveBrands();
        }

        this.cdr.markForCheck();
    }

    async activateBrand(id: string): Promise<void> {
        const confirmar = await this.modal.confirm({
            title: 'Activar marca',
            message: '¿Querés volver a activar esta marca?',
            confirmLabel: 'Activar',
            cancelLabel: 'Cancelar',
            variant: 'confirm'
        });

        if (!confirmar) return;

        this.brandService.activateBrand(id).subscribe({
            next: () => {
                this.mensaje.set('Marca activada correctamente');
                this.loadBrands();
                this.loadInactiveBrands();
                this.cdr.markForCheck();
            },
            error: () => {
                this.mensaje.set('No se pudo activar la marca');
                this.cdr.markForCheck();
            }
        });
    }
}
