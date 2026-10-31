import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

interface OpcionGestion {
    nombre: string;
    descripcion: string;
    icono: string;
    ruta: string;
    permisos: string[];
    soloAdmin?: boolean;
}

@Component({
    imports: [RouterLink],
    selector: 'app-management-home',
    styleUrl: './management-home.css',
    templateUrl: './management-home.html',
})
export class ManagementHome implements OnInit {

    opciones = signal<OpcionGestion[]>([]);

    constructor(
        private authService: AuthService
    ) {}

    ngOnInit(): void {
        this.loadOpciones();
    }

    loadOpciones(): void {
        const opcionesDisponibles: OpcionGestion[] = [
            {
                nombre: 'Productos',
                descripcion: 'Administrar productos y variantes',
                icono: '📦',
                ruta: '/management/products',
                permisos: [
                    'PRODUCT_LIST',
                    'PRODUCT_CREATE',
                    'PRODUCT_UPDATE',
                    'PRODUCT_DELETE',
                    'PRODUCT_VARIANT_LIST',
                    'PRODUCT_VARIANT_CREATE',
                    'PRODUCT_VARIANT_UPDATE'
                ]
            },
            {
                nombre: 'Categorías',
                descripcion: 'Administrar categorías',
                icono: '🗂️',
                ruta: '/management/categories',
                permisos: [
                    'CATEGORY_LIST',
                    'CATEGORY_CREATE',
                    'CATEGORY_UPDATE',
                    'CATEGORY_DELETE'
                ]
            },
            {
                nombre: 'Marcas',
                descripcion: 'Administrar marcas',
                icono: '🏷️',
                ruta: '/management/brands',
                permisos: [
                    'BRAND_LIST',
                    'BRAND_CREATE',
                    'BRAND_UPDATE',
                    'BRAND_DELETE'
                ]
            },
            {
                nombre: 'Proveedores',
                descripcion: 'Administrar proveedores',
                icono: '🚚',
                ruta: '/management/suppliers',
                permisos: [
                    'SUPPLIER_LIST',
                    'SUPPLIER_CREATE',
                    'SUPPLIER_UPDATE',
                    'SUPPLIER_DELETE'
                ]
            },
            {
                nombre: 'Stock y movimientos',
                descripcion: 'Consultar y gestionar stock',
                icono: '🏭',
                ruta: '/management/stock-movements',
                permisos: [
                    'STOCK_READ',
                    'STOCK_ENTRY',
                    'STOCK_ADJUSTMENT',
                    'STOCK_MOVEMENT_READ'
                ]
            },
            {
                nombre: 'Pedidos',
                descripcion: 'Consultar y gestionar pedidos',
                icono: '🛒',
                ruta: '/management/orders',
                permisos: [
                    'ORDER_READ_ALL',
                    'ORDER_MANAGE_STATUS',
                    'ORDER_CANCEL_ANY'
                ]
            },
            {
                nombre: 'Pagos',
                descripcion: 'Consultar pagos',
                icono: '💳',
                ruta: '/management/payments',
                permisos: ['PAYMENT_READ']
            },
            {
                nombre: 'Notificaciones',
                descripcion: 'Consultar notificaciones',
                icono: '🔔',
                ruta: '/management/notifications',
                permisos: [
                    'NOTIFICATION_READ',
                    'NOTIFICATION_CREATE'
                ]
            },
            {
                nombre: 'Usuarios',
                descripcion: 'Administrar usuarios',
                icono: '👥',
                ruta: '/management/users',
                permisos: ['USER_LIST'],
                soloAdmin: true
            }
        ];

        const visibles = opcionesDisponibles.filter(opcion => {

            if (opcion.soloAdmin) {
                return this.authService.hasRole('ROLE_ADMIN');
            }

            return this.authService.hasAnyPermission(opcion.permisos);
        });

        this.opciones.set(visibles);
    }
}
