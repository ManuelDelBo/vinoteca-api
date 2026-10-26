export interface StockMovement {
    id: string;
    type: StockMovementType;
    quantity: number;
    movementDate: string;
    reason: string;
    variantId: string;
}

export interface StockMovementRequest {
    quantity: number;
    reason: string;
    variantId: string;
}

export type StockMovementType =
    | 'ENTRY'
    | 'EXIT'
    | 'CANCELLATION';
