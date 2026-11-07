import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { BehaviorSubject, catchError, map, Observable, of, tap, throwError } from 'rxjs';

import { Cart, CartItemRequest, CartRequest } from '../models/cart';

@Service()
export class CartService {

    private http: HttpClient = inject(HttpClient);
    private url = 'http://localhost:8081/api/carts';

    private cartSubject = new BehaviorSubject<Cart | null>(null);
    cart$ = this.cartSubject.asObservable();

    private mapCart(cart: any): Cart {
        return {
            id: cart.externalId,
            userId: cart.userExternalId,
            lastUpdated: cart.lastUpdated,
            totalAmount: cart.totalAmount,
            cartItems: (cart.cartItems ?? []).map((item: any) => ({
                id: item.externalId,
                productVariantId: item.productVariantExternalId,
                productName: item.productName,
                variantAttribute: item.variantAttribute,
                quantity: item.quantity,
                unitPrice: item.unitPrice
            }))
        };
    }

    getCart(): Observable<Cart> {
        return this.http.get<any>(this.url).pipe(
            map(cart => this.mapCart(cart)),
            tap(cart => this.cartSubject.next(cart))
        );
    }

    /**
     * Recupera el carrito actual. Si el usuario todavía no tiene uno, retorna null.
     */
    getCartOrNull(): Observable<Cart | null> {
        return this.getCart().pipe(
            catchError(error => {
                if (error?.status === 404) {
                    this.cartSubject.next(null);
                    return of(null);
                }

                return throwError(() => error);
            })
        );
    }

    createOrUpdateCart(items: CartItemRequest[]): Observable<Cart> {
        const request: CartRequest = { items };

        return this.http.post<any>(this.url, request).pipe(
            map(cart => this.mapCart(cart)),
            tap(cart => this.cartSubject.next(cart))
        );
    }

    updateItemQuantity(productVariantId: string, quantity: number): Observable<Cart> {
        return this.http.patch<any>(`${this.url}/items/${productVariantId}`, { quantity }).pipe(
            map(cart => this.mapCart(cart)),
            tap(cart => this.cartSubject.next(cart))
        );
    }

    clearCart(): Observable<void> {
        return this.http.delete<void>(this.url).pipe(
            tap(() => this.cartSubject.next(null))
        );
    }

    clearLocalState(): void {
        this.cartSubject.next(null);
    }
}
