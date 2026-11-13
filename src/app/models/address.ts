export interface Address {
    externalId: string;
    street: string;
    streetNumber: string;
    floor: string | null;
    apartmentNumber: string | null;
    city: string;
    zipCode: string;
    userExternalId: string;
}

export interface AddressRequest {
    street: string;
    streetNumber: string;
    floor: string | null;
    apartmentNumber: string | null;
    city: string;
    zipCode: string;
}
