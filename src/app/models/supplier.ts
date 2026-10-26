export interface Supplier {
    id: string;
    name: string;
    contact: string;
    active: boolean;
}

export interface SupplierRequest {
    name: string;
    contact: string;
    active?: boolean | null;
}
