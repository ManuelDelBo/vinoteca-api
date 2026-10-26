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

export type Role =
    | 'ROLE_GUEST'
    | 'ROLE_CUSTOMER'
    | 'ROLE_EMPLOYEE'
    | 'ROLE_ADMIN';
