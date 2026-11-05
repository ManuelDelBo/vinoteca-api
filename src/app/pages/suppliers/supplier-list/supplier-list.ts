import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SupplierService } from '../../../services/supplier.service';
import { Supplier } from '../../../models/supplier';

@Component({
    imports: [RouterLink],
    selector: 'app-supplier-list',
    styleUrl: './supplier-list.css',
    templateUrl: './supplier-list.html',
})
export class SupplierList implements OnInit {

    suppliers = signal<Supplier[]>([]);
    inactiveSuppliers = signal<Supplier[]>([]);
    mostrarInactivos = signal<boolean>(false);
    mensaje = signal<string>('');

    constructor(private supplierService: SupplierService) {}

    ngOnInit(): void {
        this.loadSuppliers();
    }

    loadSuppliers(): void {
        this.supplierService.getSuppliers().subscribe(data => {
            this.suppliers.set(data);
        });
    }

    deleteSupplier(id: string): void {
        const confirmar = confirm('¿Estás segura de que querés eliminar este proveedor?');

        if (!confirmar) return;

        this.supplierService.deleteSupplier(id).subscribe({
            next: () => {
                this.mensaje.set('Proveedor eliminado correctamente');
                this.loadSuppliers();
            },
            error: (error) => {
                this.mensaje.set(
                    error.error?.message || 'No se pudo eliminar el proveedor.'
                );
            }
        });
    }

    loadInactiveSuppliers(): void {
        this.supplierService.getInactiveSuppliers().subscribe(data => {
            this.inactiveSuppliers.set(data);
        });
    }

    toggleInactiveSuppliers(): void {
        this.mostrarInactivos.update(valor => !valor);

        if (this.mostrarInactivos()) {
            this.loadInactiveSuppliers();
        }
    }

    activateSupplier(id: string): void {
        const confirmar = confirm('¿Querés volver a activar este proveedor?');

        if (!confirmar) return;

        this.supplierService.activateSupplier(id).subscribe({
            next: () => {
                this.mensaje.set('Proveedor activado correctamente');
                this.loadSuppliers();
                this.loadInactiveSuppliers();
            },
            error: () => {
                this.mensaje.set('No se pudo activar el proveedor');
            }
        });
    }
}