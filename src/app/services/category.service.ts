import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { map } from 'rxjs';
import { Category } from '../models/category';


@Service()
export class CategoryService {

    private http: HttpClient = inject(HttpClient);
    private url = 'http://localhost:8081/api/categories';

    getCategories() {
        return this.http.get<any[]>(this.url).pipe(
            map(categories => categories.map(category => ({
                id: category.externalId,
                name: category.name,
                active: category.active
            })))
        );
    }

    getCategoryById(id: string) {
        return this.http.get<any>(`${this.url}/${id}`).pipe(
            map(category => ({
                id: category.externalId,
                name: category.name,
                active: category.active
            }))
        );
    }

    addCategory(category: Category) {
        const request = {
            name: category.name,
            active: category.active
        };

        return this.http.post<any>(this.url, request).pipe(
            map(category => ({
                id: category.externalId,
                name: category.name,
                active: category.active
            }))
        );
    }

    updateCategory(category: Category) {
        const request = {
            name: category.name,
            active: category.active
        };

        return this.http.put<any>(`${this.url}/${category.id}`, request).pipe(
            map(category => ({
                id: category.externalId,
                name: category.name,
                active: category.active
            }))
        );
    }

    deleteCategory(id: string) {
        return this.http.delete<void>(`${this.url}/${id}`);
    }

    activateCategory(id: string) {
        return this.http.patch<void>(`${this.url}/${id}/activate`, {});
    }

    getInactiveCategories() {
        return this.http.get<any[]>(`${this.url}/inactive`).pipe(
            map(categories => categories.map(category => ({
                id: category.externalId,
                name: category.name,
                active: category.active
            })))
        );
    }
}
