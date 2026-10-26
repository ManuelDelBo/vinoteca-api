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
}

export interface OrderRequest {
    userExternalId: string;
    deliveryType: DeliveryType;
    addressExternalId?: string | null;
}

export type OrderStatus =
    | 'PENDING'
    | 'CONFIRMED'
    | 'PREPARING'
    | 'SHIPPED'
    | 'DELIVERED'
    | 'CANCELLED';

export type DeliveryType =
    | 'PICKUP'
    | 'DELIVERY';
