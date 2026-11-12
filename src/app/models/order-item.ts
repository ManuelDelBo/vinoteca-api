export interface OrderItem {
    id: string;
    orderId: string;
    productVariantId: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    // Datos de apoyo para la UI. No forman parte del DTO de orden:
    // se completan consultando la variante actual cuando está disponible.
    productName?: string | null;
    variantAttribute?: string | null;
}

export interface OrderItemRequest {
    productVariantExternalId: string;
    quantity: number;
}
