import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { map } from 'rxjs';

import { ProductVariant, ProductVariantRequest } from '../models/product-variant';

@Service()
export class ProductVariantService {

    private http: HttpClient = inject(HttpClient);
    private url = 'http://localhost:8081/api/product-variants';

    private mapVariant(variant: any): ProductVariant {
        return {
            id: variant.externalId,
            attribute: variant.attribute,
            price: variant.price,
            stock: variant.stock,
            active: variant.active,
            wholesalePrice: variant.wholesalePrice,
            wholesaleMinQty: variant.wholesaleMinQty,
            productId: variant.productId,
            productName: variant.productName
        };
    }

    getVariantsByProduct(productId: string) {
        const params = new HttpParams().set('productId', productId);

        return this.http.get<any[]>(`${this.url}/search`, { params }).pipe(
            map(variants => variants.map(variant => this.mapVariant(variant)))
        );
    }

    getInactiveVariantsByProduct(productId: string) {
        const params = new HttpParams().set('productId', productId);

        return this.http.get<any[]>(`${this.url}/inactive`, { params }).pipe(
            map(variants => variants.map(variant => this.mapVariant(variant)))
        );
    }

    getVariantById(id: string) {
        return this.http.get<any>(`${this.url}/${id}`).pipe(
            map(variant => this.mapVariant(variant))
        );
    }

    createVariant(variant: ProductVariantRequest) {
        return this.http.post<any>(this.url, variant).pipe(
            map(response => this.mapVariant(response))
        );
    }

    updateVariant(id: string, variant: ProductVariantRequest) {
        return this.http.put<any>(`${this.url}/${id}`, variant).pipe(
            map(response => this.mapVariant(response))
        );
    }

    deleteVariant(id: string) {
        return this.http.delete<void>(`${this.url}/${id}`);
    }

    activateVariant(id: string) {
        return this.http.patch<void>(`${this.url}/${id}/activate`, {});
    }
}
