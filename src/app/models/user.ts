export interface User {
    id: string;
    email: string;
    name: string;
    lastName: string;
    roles: Role[];
    active: boolean;
}

export interface UserRequest {
    email: string;
    name: string;
    lastName: string;
    password: string;
    role: Role;
}

export interface UserProfileUpdate {
    name: string;
    lastName: string;
    email: string;
}

export type Role =
    | 'ROLE_GUEST'
    | 'ROLE_CUSTOMER'
    | 'ROLE_EMPLOYEE'
    | 'ROLE_ADMIN';
