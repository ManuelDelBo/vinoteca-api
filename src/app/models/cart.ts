// 1. Un producto dentro del carrito que se envía al backend
export interface CartItemRequest {
    productVariantId: string;
    quantity: number;
}

// 2. La solicitud para crear o actualizar el carrito
export interface CartRequest {
    userId: string;
    items: CartItemRequest[];
}

// 3. Un producto dentro del carrito que devuelve el backend
export interface CartItem {
    productVariantId: string;
    productName: string;
    variantAttribute: string;
    quantity: number;
    unitPrice: number;
}

// 4. El carrito completo que devuelve el backend
export interface Cart {
    id: string;
    userId: string;
    lastUpdated: string;
    totalAmount: number;
    cartItems: CartItem[];
}
