import { OrderItem } from "./order-item";

export interface Order {
    id: string;
    userId: string;
    addressId: string | null;
    total: number;
    createdAt: string;
    status: OrderStatus;
    deliveryType: DeliveryType;
    items: OrderItem[];
    customerName?: string | null;
}

export interface OrderSummary {
    id: string;
    total: number;
    status: OrderStatus;
    createdAt: string;
    customerName?: string | null;
}

export interface CheckoutRequest {
    deliveryType: DeliveryType;
    addressId?: string | null;
}

export interface OrderRequest {
    userExternalId: string;
    deliveryType: DeliveryType;
    addressExternalId?: string | null;
}

export type OrderStatus =
    | 'PENDING_PAYMENT'
    | 'PAID'
    | 'CANCELLED';

export type DeliveryType =
    | 'PICKUP'
    | 'DELIVERY';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
    PENDING_PAYMENT: 'Pendiente de pago',
    PAID: 'Pagado',
    CANCELLED: 'Cancelado',
};

export const DELIVERY_TYPE_LABELS: Record<DeliveryType, string> = {
    DELIVERY: 'Entrega a domicilio',
    PICKUP: 'Retiro en tienda',
};
