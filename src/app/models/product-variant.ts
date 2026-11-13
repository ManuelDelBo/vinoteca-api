export interface ProductVariant {
    id: string;
    attribute: string;
    price: number;
    stock: number;
    active: boolean;
    wholesalePrice: number | null;
    wholesaleMinQty: number | null;
    productId: string;
    productName: string;
}

export interface ProductVariantRequest {
    attribute: string;
    price: number;
    stock: number;
    wholesalePrice?: number | null;
    wholesaleMinQty?: number | null;
    productId: string;
}

export interface DisabledVariant {
    id: string;
    attribute: string;
}