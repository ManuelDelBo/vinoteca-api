import { ChangeDetectorRef, Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ConfirmDialog } from '../../../shared/confirm-dialog/confirm-dialog';
import { CategoryService } from '../../../services/category.service';
import { Category } from '../../../models/category';

interface PendingDeletion {
    id: string;
    name: string;
    count: number;
}

@Component({
    imports: [RouterLink, ConfirmDialog],
    selector: 'app-category-list',
    styleUrl: './category-list.css',
    templateUrl: './category-list.html',
})
export class CategoryList implements OnInit {

    categories = signal<Category[]>([]);
    inactiveCategories = signal<Category[]>([]);
    mostrarInactivas = signal<boolean>(false);
    mensaje = signal<string>('');
    pendingDeletion = signal<PendingDeletion | null>(null);
    checkingDeletion = signal<boolean>(false);
    deleting = signal<boolean>(false);

    constructor(
        private categoryService: CategoryService,
        private cdr: ChangeDetectorRef
    ) {}

    ngOnInit(): void {
        this.loadCategories();
    }

    loadCategories(): void {
        this.categoryService.getCategories().subscribe(data => {
            this.categories.set(data);
            this.cdr.markForCheck();
        });
    }

    requestDelete(category: Category): void {
        if (this.checkingDeletion() || this.deleting()) {
            return;
        }

        this.mensaje.set('');
        this.checkingDeletion.set(true);
        this.cdr.markForCheck();

        this.categoryService.getRelatedProductCount(category.id).subscribe({
            next: ({ count }) => {
                this.checkingDeletion.set(false);

                if (count <= 0) {
                    const confirmar = confirm(
                        `¿Estás seguro de que querés eliminar la categoría "${category.name}"?`
                    );

                    if (confirmar) {
                        this.performDelete(category.id, false);
                    } else {
                        this.cdr.markForCheck();
                    }

                    return;
                }

                this.pendingDeletion.set({
                    id: category.id,
                    name: category.name,
                    count
                });
                this.cdr.markForCheck();
            },
            error: () => {
                this.checkingDeletion.set(false);
                this.mensaje.set('No se pudo verificar si la categoría tiene productos asociados.');
                this.cdr.markForCheck();
            }
        });
    }

    deleteMessage(pending: PendingDeletion): string {
        return `¿Estás seguro de que querés eliminar la categoría "${pending.name}"?`;
    }

    deleteDetail(pending: PendingDeletion): string {
        const productos = pending.count === 1 ? 'producto asociado' : 'productos asociados';
        return `Esta categoría tiene ${pending.count} ${productos}.`;
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

        this.categoryService.deleteCategory(id).subscribe({
            next: () => {
                this.deleting.set(false);
                this.pendingDeletion.set(null);
                this.mensaje.set(
                    cascade
                        ? 'Categoría eliminada. También se desactivaron sus productos y variantes.'
                        : 'Categoría eliminada correctamente.'
                );
                this.loadCategories();
                this.cdr.markForCheck();
            },
            error: (error) => {
                this.deleting.set(false);
                this.pendingDeletion.set(null);
                this.mensaje.set(this.resolveError(error, 'No se pudo eliminar la categoría.'));
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

    loadInactiveCategories(): void {
        this.categoryService.getInactiveCategories().subscribe(data => {
            this.inactiveCategories.set(data);
            this.cdr.markForCheck();
        });
    }

    toggleInactiveCategories(): void {
        this.mostrarInactivas.update(valor => !valor);

        if (this.mostrarInactivas()) {
            this.loadInactiveCategories();
        }

        this.cdr.markForCheck();
    }

    activateCategory(id: string): void {
        const confirmar = confirm('¿Querés volver a activar esta categoría?');

        if (!confirmar) return;

        this.categoryService.activateCategory(id).subscribe({
            next: () => {
                this.mensaje.set('Categoría activada correctamente');
                this.loadCategories();
                this.loadInactiveCategories();
                this.cdr.markForCheck();
            },
            error: () => {
                this.mensaje.set('No se pudo activar la categoría');
                this.cdr.markForCheck();
            }
        });
    }
}
