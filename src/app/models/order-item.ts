export interface OrderItem {
    id: string;
    orderId: string;
    productVariantId: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
}

export interface OrderItemRequest {
    productVariantExternalId: string;
    quantity: number;
}
