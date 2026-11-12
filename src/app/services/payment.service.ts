import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { map, Observable } from 'rxjs';

import { Payment, PaymentRequest } from '../models/payment';

@Service()
export class PaymentService {

    private http = inject(HttpClient);
    private url = 'http://localhost:8081/api/payments';

    private mapPayment(payment: any): Payment {
        return {
            id: payment.externalId,
            orderId: payment.orderExternalId,
            paymentMethod: payment.paymentMethod,
            amount: payment.amount,
            status: payment.status,
            createdAt: payment.createdAt
        };
    }

    pay(request: PaymentRequest): Observable<Payment> {
        return this.http.post<any>(`${this.url}/pay`, request).pipe(
            map(payment => this.mapPayment(payment))
        );
    }

    getByOrder(orderId: string): Observable<Payment> {
        return this.http.get<any>(`${this.url}/order/${orderId}`).pipe(
            map(payment => this.mapPayment(payment))
        );
    }
}
