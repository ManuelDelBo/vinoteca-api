import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { map } from 'rxjs';
import { Brand } from '../models/brand';

@Service()
export class BrandService {

    private http: HttpClient = inject(HttpClient);
    private url = 'http://localhost:8081/api/brands';

    // Listar marcas activas
    getBrands() {
        return this.http.get<any[]>(this.url).pipe(
            map(brands => brands.map(brand => ({
                id: brand.externalId,
                name: brand.name,
                active: brand.active
            })))
        );
    }

    // Obtener marca por ID
    getBrandById(id: string) {
        return this.http.get<any>(`${this.url}/${id}`).pipe(
            map(brand => ({
                id: brand.externalId,
                name: brand.name,
                active: brand.active
            }))
        );
    }

    // Crear marca
    addBrand(brand: Brand) {
        const request = {
            name: brand.name,
            active: brand.active
        };

        return this.http.post<any>(this.url, request).pipe(
            map(brand => ({
                id: brand.externalId,
                name: brand.name,
                active: brand.active
            }))
        );
    }

    // Actualizar marca
    updateBrand(brand: Brand) {
        const request = {
            name: brand.name,
            active: brand.active
        };

        return this.http.put<any>(`${this.url}/${brand.id}`, request).pipe(
            map(brand => ({
                id: brand.externalId,
                name: brand.name,
                active: brand.active
            }))
        );
    }

    // Eliminar marca (eliminación lógica)
    deleteBrand(id: string) {
        return this.http.delete<void>(`${this.url}/${id}`);
    }

    // Activar marca
    activateBrand(id: string) {
        return this.http.patch<void>(`${this.url}/${id}/activate`, {});
    }

    // Listar marcas inactivas
    getInactiveBrands() {
        return this.http.get<any[]>(`${this.url}/inactive`).pipe(
            map(brands => brands.map(brand => ({
                id: brand.externalId,
                name: brand.name,
                active: brand.active
            })))
        );
    }
}
