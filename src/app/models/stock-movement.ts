export interface StockMovement {
    id: string;
    type: StockMovementType;
    quantity: number;
    movementDate: string;
    reason: string;
    variantExternalId: string;
}

export interface StockMovementRequest {
    quantity: number;
    reason: string;
    variantId: string;
}

export type StockMovementType =
    | 'ENTRY'
    | 'SALE'
    | 'CANCELLATION'
    | 'ADJUSTMENT';
