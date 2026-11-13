import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { map } from 'rxjs';

import { ProductVariant, ProductVariantRequest } from '../models/product-variant';
import { StockMovementRequest } from '../models/stock-movement';

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

    searchVariants(filters?: {
        attribute?: string;
        minStock?: number;
        productId?: string;
        categoryId?: string;
        brandId?: string;
        productName?: string;
    }) {
        let params = new HttpParams();

        if (filters?.attribute) params = params.set('attribute', filters.attribute);
        if (filters?.minStock != null) params = params.set('minStock', filters.minStock);
        if (filters?.productId) params = params.set('productId', filters.productId);
        if (filters?.categoryId) params = params.set('categoryId', filters.categoryId);
        if (filters?.brandId) params = params.set('brandId', filters.brandId);
        if (filters?.productName) params = params.set('productName', filters.productName);

        return this.http.get<any[]>(`${this.url}/search`, { params }).pipe(
            map(variants => variants.map(variant => this.mapVariant(variant)))
        );
    }

    adjustStock(request: StockMovementRequest) {
        return this.http.post<any>(`${this.url}/stock/adjustment`, request).pipe(
            map(response => this.mapVariant(response))
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
