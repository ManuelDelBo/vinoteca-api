export interface Address {
    externalId: string;
    street: string;
    streetNumber: string;
    floor: string | null;
    apartmentNumber: string | null;
    city: string;
    zipCode: string;
    userId: string;
}
