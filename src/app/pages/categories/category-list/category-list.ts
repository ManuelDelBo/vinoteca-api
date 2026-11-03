import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CategoryService } from '../../../services/category.service';
import { Category } from '../../../models/category';

@Component({
    imports: [RouterLink],
    selector: 'app-category-list',
    styleUrl: './category-list.css',
    templateUrl: './category-list.html',
})
export class CategoryList implements OnInit {

    categories = signal<Category[]>([]);
    inactiveCategories = signal<Category[]>([]);
    mostrarInactivas = signal<boolean>(false);
    mensaje = signal<string>('');

    constructor(private categoryService: CategoryService) {}

    ngOnInit(): void {
        this.loadCategories();
    }

    loadCategories(): void {
        this.categoryService.getCategories().subscribe(data => {
            this.categories.set(data);
        });
    }

    deleteCategory(id: string): void {
        const confirmar = confirm('¿Estás segura de que querés eliminar esta categoría?');

        if (!confirmar) return;

        this.categoryService.deleteCategory(id).subscribe({
            next: () => {
                this.mensaje.set('Categoría eliminada correctamente');
                this.loadCategories();
            },
            error: (error) => {
                this.mensaje.set(
                    error.error?.message || 'No se pudo eliminar la categoría. Puede tener productos relacionados.'
                );
            }
        });
    }

    loadInactiveCategories(): void {
        this.categoryService.getInactiveCategories().subscribe(data => {
            this.inactiveCategories.set(data);
        });
    }

    toggleInactiveCategories(): void {
        this.mostrarInactivas.update(valor => !valor);

        if (this.mostrarInactivas()) {
            this.loadInactiveCategories();
        }
    }

    activateCategory(id: string): void {
        const confirmar = confirm('¿Querés volver a activar esta categoría?');

        if (!confirmar) return;

        this.categoryService.activateCategory(id).subscribe({
            next: () => {
                this.mensaje.set('Categoría activada correctamente');
                this.loadCategories();
                this.loadInactiveCategories();
            },
            error: () => {
                this.mensaje.set('No se pudo activar la categoría');
            }
        });
    }
}
