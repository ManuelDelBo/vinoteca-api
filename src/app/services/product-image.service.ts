import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { map } from 'rxjs';

import { ProductImage } from '../models/product-image';

@Service()
export class ProductImageService {

    private http: HttpClient = inject(HttpClient);
    private apiUrl = 'http://localhost:8081';
    private url = `${this.apiUrl}/api/products`;

    private mapImage(image: any): ProductImage {
        return {
            id: image.externalId,
            imagePath: image.imagePath,
            url: this.toAbsoluteUrl(image.url),
            principal: image.principal
        };
    }

    private toAbsoluteUrl(url: string | null | undefined): string {
        if (!url) {
            return '';
        }

        return url.startsWith('http') ? url : `${this.apiUrl}${url}`;
    }

    getImages(productId: string) {
        return this.http.get<any[]>(`${this.url}/${productId}/images`).pipe(
            map(images => images.map(image => this.mapImage(image)))
        );
    }

    uploadImages(productId: string, files: File[]) {
        const formData = new FormData();

        files.forEach(file => formData.append('files', file, file.name));

        return this.http.post<any[]>(`${this.url}/${productId}/images`, formData).pipe(
            map(images => images.map(image => this.mapImage(image)))
        );
    }

    deleteImage(productId: string, imageId: string) {
        return this.http.delete<void>(`${this.url}/${productId}/images/${imageId}`);
    }

    setPrincipal(productId: string, imageId: string) {
        return this.http.patch<any>(`${this.url}/${productId}/images/${imageId}/principal`, {}).pipe(
            map(image => this.mapImage(image))
        );
    }
}
