import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { map } from 'rxjs';

import { StockMovement } from '../models/stock-movement';

@Service()
export class StockMovementService {

    private http: HttpClient = inject(HttpClient);
    private url = 'http://localhost:8081/api/stock-movements';

    private mapMovement(movement: any): StockMovement {
        return {
            id: movement.externalId,
            type: movement.type,
            quantity: movement.quantity,
            movementDate: movement.movementDate,
            reason: movement.reason ?? '',
            variantExternalId: movement.variantExternalId
        };
    }

    getByVariant(variantId: string) {
        return this.http.get<any[]>(`${this.url}/variant/${variantId}`).pipe(
            map(movements => movements
                .map(movement => this.mapMovement(movement))
                .sort((a, b) =>
                    new Date(b.movementDate).getTime() - new Date(a.movementDate).getTime()
                )
            )
        );
    }
}
