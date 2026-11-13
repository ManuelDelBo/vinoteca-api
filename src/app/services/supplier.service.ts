import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { map } from 'rxjs';
import { Supplier } from '../models/supplier';

@Service()
export class SupplierService {

    private http: HttpClient = inject(HttpClient);
    private url = 'http://localhost:8081/api/suppliers';

    getSuppliers() {
        return this.http.get<any[]>(this.url).pipe(
            map(suppliers => suppliers.map(supplier => ({
                id: supplier.externalId,
                name: supplier.name,
                contact: supplier.contact,
                active: supplier.active
            })))
        );
    }

    getSupplierById(id: string) {
        return this.http.get<any>(`${this.url}/${id}`).pipe(
            map(supplier => ({
                id: supplier.externalId,
                name: supplier.name,
                contact: supplier.contact,
                active: supplier.active
            }))
        );
    }

    addSupplier(supplier: Supplier) {
        const request = {
            name: supplier.name,
            contact: supplier.contact,
            active: supplier.active
        };

        return this.http.post<any>(this.url, request).pipe(
            map(supplier => ({
                id: supplier.externalId,
                name: supplier.name,
                contact: supplier.contact,
                active: supplier.active
            }))
        );
    }

    updateSupplier(supplier: Supplier) {
        const request = {
            name: supplier.name,
            contact: supplier.contact,
            active: supplier.active
        };

        return this.http.put<any>(`${this.url}/${supplier.id}`, request).pipe(
            map(supplier => ({
                id: supplier.externalId,
                name: supplier.name,
                contact: supplier.contact,
                active: supplier.active
            }))
        );
    }

    deleteSupplier(id: string) {
        return this.http.delete<void>(`${this.url}/${id}`);
    }

    getRelatedProductCount(id: string) {
        return this.http.get<{ count: number }>(`${this.url}/${id}/products/count`);
    }

    activateSupplier(id: string) {
        return this.http.patch<void>(`${this.url}/${id}/activate`, {});
    }

    getInactiveSuppliers() {
        return this.http.get<any[]>(`${this.url}/inactive`).pipe(
            map(suppliers => suppliers.map(supplier => ({
                id: supplier.externalId,
                name: supplier.name,
                contact: supplier.contact,
                active: supplier.active
            })))
        );
    }
}
