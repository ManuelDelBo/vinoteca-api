import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { map, Observable } from 'rxjs';

import { CheckoutRequest, Order, OrderSummary } from '../models/order';
import { OrderItem } from '../models/order-item';

export interface CheckoutOutcome {
    order: Order;
    replayed: boolean;
}

@Service()
export class OrderService {

    private http = inject(HttpClient);
    private url = 'http://localhost:8081/api/orders';
    private checkoutUrl = 'http://localhost:8081/api/carts/checkout';

    private mapItem(item: any): OrderItem {
        return {
            id: item.externalId,
            orderId: item.orderExternalId,
            productVariantId: item.productVariantExternalId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.subtotal
        };
    }

    private mapOrder(order: any): Order {
        return {
            id: order.externalId,
            userId: order.userExternalId,
            addressId: order.addressExternalId ?? null,
            total: order.total,
            createdAt: order.createdAt,
            status: order.status,
            deliveryType: order.deliveryType,
            items: (order.items ?? []).map((item: any) => this.mapItem(item)),
            customerName: order.customerName ?? null
        };
    }

    private mapSummary(order: any): OrderSummary {
        return {
            id: order.externalId,
            total: order.total,
            status: order.status,
            createdAt: order.createdAt,
            customerName: order.customerName ?? null
        };
    }

    /**
     * Convierte el carrito del usuario autenticado en una orden.
     * El backend recibe deliveryType y addressId como query params y
     * exige el header Idempotency-Key.
     */
    checkout(request: CheckoutRequest, idempotencyKey: string): Observable<CheckoutOutcome> {
        let params = new HttpParams().set('deliveryType', request.deliveryType);

        if (request.addressId) {
            params = params.set('addressId', request.addressId);
        }

        return this.http.post<any>(this.checkoutUrl, null, {
            headers: { 'Idempotency-Key': idempotencyKey },
            params,
            observe: 'response'
        }).pipe(
            map(response => ({
                order: this.mapOrder(response.body),
                replayed: response.status === 200
            }))
        );
    }

    getMyOrders(): Observable<OrderSummary[]> {
        return this.http.get<any[]>(`${this.url}/user`).pipe(
            map(orders => orders.map(order => this.mapSummary(order)))
        );
    }

    getOrderById(id: string): Observable<Order> {
        return this.http.get<any>(`${this.url}/${id}`).pipe(
            map(order => this.mapOrder(order))
        );
    }

    getAllOrders(): Observable<OrderSummary[]> {
        return this.http.get<any[]>(`${this.url}/admin`).pipe(
            map(orders => orders.map(order => this.mapSummary(order)))
        );
    }

    getAdminOrderById(id: string): Observable<Order> {
        return this.http.get<any>(`${this.url}/admin/${id}`).pipe(
            map(order => this.mapOrder(order))
        );
    }

    getOrdersByUser(userExternalId: string): Observable<OrderSummary[]> {
        return this.http.get<any[]>(`${this.url}/admin/user/${userExternalId}`).pipe(
            map(orders => orders.map(order => this.mapSummary(order)))
        );
    }

    cancelOrder(id: string): Observable<void> {
        return this.http.post<void>(`${this.url}/${id}/cancel`, null);
    }
}
