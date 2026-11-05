import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { map } from 'rxjs';

import { Product, ProductRequest, ProductDeleteResponse } from '../models/product';

@Service()
export class ProductService {

    private http: HttpClient = inject(HttpClient);
    private url = 'http://localhost:8081/api/products';

    private mapProduct(product: any): Product {
        return {
            id: product.externalId,
            name: product.name,
            description: product.description,
            active: product.active,
            supplierId: product.supplierId,
            supplierName: product.supplierName,
            categoryId: product.categoryId,
            categoryName: product.categoryName,
            brandId: product.brandId,
            brandName: product.brandName
        };
    }

    getProducts(filters?: {
        name?: string;
        supplierId?: string;
        categoryId?: string;
        brandId?: string;
    }) {
        let params = new HttpParams();

        if (filters?.name) params = params.set('name', filters.name);
        if (filters?.supplierId) params = params.set('supplierId', filters.supplierId);
        if (filters?.categoryId) params = params.set('categoryId', filters.categoryId);
        if (filters?.brandId) params = params.set('brandId', filters.brandId);

        return this.http.get<any[]>(`${this.url}/search`, { params }).pipe(
            map(products => products.map(product => this.mapProduct(product)))
        );
    }

    getInactiveProducts(filters?: {
        name?: string;
        supplierId?: string;
        categoryId?: string;
        brandId?: string;
    }) {
        let params = new HttpParams();

        if (filters?.name) params = params.set('name', filters.name);
        if (filters?.supplierId) params = params.set('supplierId', filters.supplierId);
        if (filters?.categoryId) params = params.set('categoryId', filters.categoryId);
        if (filters?.brandId) params = params.set('brandId', filters.brandId);

        return this.http.get<any[]>(`${this.url}/inactive`, { params }).pipe(
            map(products => products.map(product => this.mapProduct(product)))
        );
    }

    getProductById(id: string) {
        return this.http.get<any>(`${this.url}/${id}`).pipe(
            map(product => this.mapProduct(product))
        );
    }

    createProduct(product: ProductRequest) {
        return this.http.post<any>(this.url, product).pipe(
            map(response => this.mapProduct(response))
        );
    }

    updateProduct(id: string, product: ProductRequest) {
        return this.http.put<any>(`${this.url}/${id}`, product).pipe(
            map(response => this.mapProduct(response))
        );
    }

    deleteProduct(id: string) {
        return this.http.delete<any>(`${this.url}/${id}`).pipe(
            map(response => ({
                productId: response.productExternalId,
                productName: response.productName,
                active: response.active,
                disabledVariants: (response.disabledVariants ?? []).map((variant: any) => ({
                    id: variant.externalId,
                    attribute: variant.attribute
                }))
            } as ProductDeleteResponse))
        );
    }

    activateProduct(id: string) {
        return this.http.patch<void>(`${this.url}/${id}/activate`, {});
    }
}
