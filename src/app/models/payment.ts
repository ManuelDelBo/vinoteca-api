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
}

export type PaymentMethod =
    | 'CREDIT_CARD'
    | 'DEBIT_CARD'
    | 'CASH'
    | 'TRANSFER'
    | 'MERCADO_PAGO';

export type PaymentStatus =
    | 'PENDING'
    | 'APPROVED'
    | 'REJECTED';

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
    CREDIT_CARD: 'Tarjeta de crédito',
    DEBIT_CARD: 'Tarjeta de débito',
    CASH: 'Efectivo',
    TRANSFER: 'Transferencia',
    MERCADO_PAGO: 'Mercado Pago',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
    PENDING: 'Pendiente',
    APPROVED: 'Aprobado',
    REJECTED: 'Rechazado',
};
