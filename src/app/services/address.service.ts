import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { Address, AddressRequest } from '../models/address';

@Service()
export class AddressService {

    private http = inject(HttpClient);
    private url = 'http://localhost:8081/api/addresses';

    getAddressesByUser(userExternalId: string): Observable<Address[]> {
        return this.http.get<Address[]>(`${this.url}/user/${userExternalId}`);
    }

    createAddress(request: AddressRequest): Observable<Address> {
        return this.http.post<Address>(this.url, request);
    }

    updateAddress(externalId: string, request: AddressRequest): Observable<Address> {
        return this.http.put<Address>(`${this.url}/${externalId}`, request);
    }

    deleteAddress(externalId: string): Observable<void> {
        return this.http.delete<void>(`${this.url}/${externalId}`);
    }
}
