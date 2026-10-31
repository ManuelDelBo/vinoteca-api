import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BrandService } from '../../../services/brand.service';
import { Brand } from '../../../models/brand';

@Component({
    imports: [RouterLink],
    selector: 'app-brand-list',
    styleUrl: './brand-list.css',
    templateUrl: './brand-list.html'
})
export class BrandList implements OnInit {

    brands = signal<Brand[]>([]);
    inactiveBrands = signal<Brand[]>([]);
    mostrarInactivas = signal<boolean>(false);
    mensaje = signal<string>('');

    constructor(private brandService: BrandService) {}

    ngOnInit(): void {
        this.loadBrands();
    }

    loadBrands(): void {
        this.brandService.getBrands().subscribe(data => {
            this.brands.set(data);
        });
    }

    deleteBrand(id: string): void {
        const confirmar = confirm('¿Estás segura de que querés eliminar esta marca?');

        if (!confirmar) return;

        this.brandService.deleteBrand(id).subscribe({
            next: () => {
                this.mensaje.set('Marca eliminada correctamente');
                this.loadBrands();
            },
            error: (error) => {
                this.mensaje.set(
                    error.error?.message || 'No se pudo eliminar la marca. Puede tener productos relacionados.'
                );
            }
        });
    }

    loadInactiveBrands(): void {
        this.brandService.getInactiveBrands().subscribe(data => {
            this.inactiveBrands.set(data);
        });
    }

    toggleInactiveBrands(): void {
        this.mostrarInactivas.update(valor => !valor);

        if (this.mostrarInactivas()) {
            this.loadInactiveBrands();
        }
    }

    activateBrand(id: string): void {
        const confirmar = confirm('¿Querés volver a activar esta marca?');

        if (!confirmar) return;

        this.brandService.activateBrand(id).subscribe({
            next: () => {
                this.mensaje.set('Marca activada correctamente');
                this.loadBrands();
                this.loadInactiveBrands();
            },
            error: () => {
                this.mensaje.set('No se pudo activar la marca');
            }
        });
    }
}
