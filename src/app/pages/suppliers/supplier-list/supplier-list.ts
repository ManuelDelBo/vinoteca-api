import { ChangeDetectorRef, Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ConfirmDialog } from '../../../shared/confirm-dialog/confirm-dialog';
import { ModalService } from '../../../shared/modal/modal.service';
import { SupplierService } from '../../../services/supplier.service';
import { Supplier } from '../../../models/supplier';

interface PendingDeletion {
    id: string;
    name: string;
    count: number;
}

@Component({
    imports: [RouterLink, ConfirmDialog],
    selector: 'app-supplier-list',
    styleUrl: './supplier-list.css',
    templateUrl: './supplier-list.html',
})
export class SupplierList implements OnInit {

    suppliers = signal<Supplier[]>([]);
    inactiveSuppliers = signal<Supplier[]>([]);
    mostrarInactivos = signal<boolean>(false);
    mensaje = signal<string>('');
    pendingDeletion = signal<PendingDeletion | null>(null);
    checkingDeletion = signal<boolean>(false);
    deleting = signal<boolean>(false);

    constructor(
        private supplierService: SupplierService,
        private modal: ModalService,
        private cdr: ChangeDetectorRef
    ) {}

    ngOnInit(): void {
        this.loadSuppliers();
    }

    loadSuppliers(): void {
        this.supplierService.getSuppliers().subscribe(data => {
            this.suppliers.set(data);
            this.cdr.markForCheck();
        });
    }

    requestDelete(supplier: Supplier): void {
        if (this.checkingDeletion() || this.deleting()) {
            return;
        }

        this.mensaje.set('');
        this.checkingDeletion.set(true);
        this.cdr.markForCheck();

        this.supplierService.getRelatedProductCount(supplier.id).subscribe({
            next: async ({ count }) => {
                this.checkingDeletion.set(false);

                if (count <= 0) {
                    const confirmar = await this.modal.confirm({
                        title: 'Eliminar proveedor',
                        message: `¿Estás seguro de que querés eliminar el proveedor "${supplier.name}"?`,
                        confirmLabel: 'Eliminar',
                        cancelLabel: 'Cancelar',
                        variant: 'danger'
                    });

                    if (confirmar) {
                        this.performDelete(supplier.id, false);
                    } else {
                        this.cdr.markForCheck();
                    }

                    return;
                }

                this.pendingDeletion.set({
                    id: supplier.id,
                    name: supplier.name,
                    count
                });
                this.cdr.markForCheck();
            },
            error: () => {
                this.checkingDeletion.set(false);
                this.mensaje.set('No se pudo verificar si el proveedor tiene productos asociados.');
                this.cdr.markForCheck();
            }
        });
    }

    deleteMessage(pending: PendingDeletion): string {
        return `¿Estás seguro de que querés eliminar el proveedor "${pending.name}"?`;
    }

    deleteDetail(pending: PendingDeletion): string {
        const productos = pending.count === 1 ? 'producto asociado' : 'productos asociados';
        return `Este proveedor tiene ${pending.count} ${productos}.`;
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

        this.supplierService.deleteSupplier(id).subscribe({
            next: () => {
                this.deleting.set(false);
                this.pendingDeletion.set(null);
                this.mensaje.set(
                    cascade
                        ? 'Proveedor eliminado. También se desactivaron sus productos y variantes.'
                        : 'Proveedor eliminado correctamente.'
                );
                this.loadSuppliers();
                this.cdr.markForCheck();
            },
            error: (error) => {
                this.deleting.set(false);
                this.pendingDeletion.set(null);
                this.mensaje.set(this.resolveError(error, 'No se pudo eliminar el proveedor.'));
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

    loadInactiveSuppliers(): void {
        this.supplierService.getInactiveSuppliers().subscribe(data => {
            this.inactiveSuppliers.set(data);
            this.cdr.markForCheck();
        });
    }

    toggleInactiveSuppliers(): void {
        this.mostrarInactivos.update(valor => !valor);

        if (this.mostrarInactivos()) {
            this.loadInactiveSuppliers();
        }

        this.cdr.markForCheck();
    }

    async activateSupplier(id: string): Promise<void> {
        const confirmar = await this.modal.confirm({
            title: 'Activar proveedor',
            message: '¿Querés volver a activar este proveedor?',
            confirmLabel: 'Activar',
            cancelLabel: 'Cancelar',
            variant: 'confirm'
        });

        if (!confirmar) return;

        this.supplierService.activateSupplier(id).subscribe({
            next: () => {
                this.mensaje.set('Proveedor activado correctamente');
                this.loadSuppliers();
                this.loadInactiveSuppliers();
                this.cdr.markForCheck();
            },
            error: () => {
                this.mensaje.set('No se pudo activar el proveedor');
                this.cdr.markForCheck();
            }
        });
    }
}
