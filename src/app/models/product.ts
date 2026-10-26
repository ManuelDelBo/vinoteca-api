export interface Product {
    id: string;
    name: string;
    description: string | null;
    active: boolean;
    supplierId: string;
    supplierName: string;
    categoryId: string;
    categoryName: string;
    brandId: string;
    brandName: string;
}

export interface ProductRequest {
    name: string;
    description?: string | null;
    supplierId: string;
    categoryId: string;
    brandId: string;
}

export interface ProductDeleteResponse {
    productId: string;
    productName: string;
    active: boolean;
    disabledVariants: DisabledVariant[];
}


import { DisabledVariant } from './product-variant';
