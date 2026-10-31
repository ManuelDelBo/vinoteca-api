import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { AuthRequest, AuthResponse } from '../models/auth';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { User, UserRequest } from '../models/user';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private http = inject(HttpClient);
    private apiUrl = 'http://localhost:8081/api/auth';

    private loggedInSubject = new BehaviorSubject<boolean>(
        !!localStorage.getItem('token')
    );

    loggedIn$ = this.loggedInSubject.asObservable();

    private rolesSubject = new BehaviorSubject<string[]>([]);
    roles$ = this.rolesSubject.asObservable();

    private permissionsSubject = new BehaviorSubject<string[]>([]);
    permissions$ = this.permissionsSubject.asObservable();

    constructor() {
        const token = localStorage.getItem('token');

        if (token) {
            this.loadAuthorities(token);
        }
    }

    login(credentials: AuthRequest): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(
            `${this.apiUrl}/login`,
            credentials
        ).pipe(
            tap(response => {
                localStorage.setItem('token', response.token);
                this.loadAuthorities(response.token);
                this.loggedInSubject.next(true);
            })
        );
    }

    register(user: UserRequest): Observable<User> {
        return this.http.post<User>(
            `${this.apiUrl}/register`,
            user
        );
    }

    logout(): void {
        localStorage.removeItem('token');

        this.loggedInSubject.next(false);
        this.rolesSubject.next([]);
        this.permissionsSubject.next([]);
    }

    getToken(): string | null {
        return localStorage.getItem('token');
    }

    isLoggedIn(): boolean {
        return !!this.getToken();
    }

    hasRole(role: string): boolean {
        return this.rolesSubject.value.includes(role);
    }

    hasPermission(permission: string): boolean {
        return this.permissionsSubject.value.includes(permission);
    }

    hasAnyPermission(permissions: string[]): boolean {
        return permissions.some(permission =>
            this.hasPermission(permission)
        );
    }

    private loadAuthorities(token: string): void {
        try {
            const payload = token.split('.')[1];

            if (!payload) {
                throw new Error('Token inválido');
            }

            const base64 = payload
                .replace(/-/g, '+')
                .replace(/_/g, '/');

            const decodedPayload = atob(base64);
            const data = JSON.parse(decodedPayload);

            const authorities: string[] = Array.isArray(data.roles)
                ? data.roles
                : [];

            const roles = authorities.filter(authority =>
                authority.startsWith('ROLE_')
            );

            const permissions = authorities.filter(authority =>
                !authority.startsWith('ROLE_')
            );

            this.rolesSubject.next(roles);
            this.permissionsSubject.next(permissions);

        } catch (error) {
            console.error('No se pudieron obtener los permisos del token:', error);

            this.rolesSubject.next([]);
            this.permissionsSubject.next([]);
        }
    }
}

