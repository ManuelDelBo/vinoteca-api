export interface ProductImage {
    id: string;
    imagePath: string;
    url: string;
    principal: boolean;
}

export interface PendingProductImage {
    file: File;
    previewUrl: string;
}
