export interface Payment {
    id: string;
    orderId: string;
    paymentMethod: PaymentMethod;
    amount: number;
    status: PaymentStatus;
    createdAt: string;
}

export interface PaymentRequest {
    orderId: string;
    paymentMethod: PaymentMethod;
    amount: number;
}

export type PaymentMethod =
    | 'CREDIT_CARD'
    | 'DEBIT_CARD'
    | 'CASH'
    | 'TRANSFER';

export type PaymentStatus =
    | 'PENDING'
    | 'APPROVED'
    | 'REJECTED';