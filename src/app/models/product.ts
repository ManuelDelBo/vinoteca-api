import { DisabledVariant } from './product-variant';
import { ProductImage } from './product-image';

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
    principalImagePath: string | null;
    images: ProductImage[];
    /** Precio de la variante activa con stock más económica, calculado por el backend. */
    minPrice: number | null;
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
