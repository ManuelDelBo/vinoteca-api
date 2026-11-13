import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { AuthRequest, AuthResponse } from '../models/auth';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { User, UserRequest } from '../models/user';

interface TokenPayload {
    exp?: number;
    roles?: string[];
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private static readonly TOKEN_KEY = 'token';

    private http = inject(HttpClient);
    private apiUrl = 'http://localhost:8081/api/auth';

    private loggedInSubject = new BehaviorSubject<boolean>(false);

    loggedIn$ = this.loggedInSubject.asObservable();

    private rolesSubject = new BehaviorSubject<string[]>([]);
    roles$ = this.rolesSubject.asObservable();

    private permissionsSubject = new BehaviorSubject<string[]>([]);
    permissions$ = this.permissionsSubject.asObservable();

    constructor() {
        const token = this.getValidToken();

        this.loggedInSubject.next(!!token);

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
                localStorage.setItem(AuthService.TOKEN_KEY, response.token);
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
        localStorage.removeItem(AuthService.TOKEN_KEY);

        this.loggedInSubject.next(false);
        this.rolesSubject.next([]);
        this.permissionsSubject.next([]);
    }

    getToken(): string | null {
        return this.getValidToken();
    }

    isLoggedIn(): boolean {
        return !!this.getValidToken();
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

    /**
     * Devuelve el token solo si existe y no está vencido.
     * Si el token guardado ya expiró (o no se puede leer), limpia la sesión
     * para que el header vuelva al estado de invitado.
     */
    private getValidToken(): string | null {
        const token = localStorage.getItem(AuthService.TOKEN_KEY);

        if (!token) {
            return null;
        }

        const payload = this.decodePayload(token);

        if (!payload) {
            this.logout();
            return null;
        }

        if (typeof payload.exp === 'number' && payload.exp * 1000 <= Date.now()) {
            this.logout();
            return null;
        }

        return token;
    }

    private decodePayload(token: string): TokenPayload | null {
        try {
            const payload = token.split('.')[1];

            if (!payload) {
                return null;
            }

            const base64 = payload
                .replace(/-/g, '+')
                .replace(/_/g, '/');

            const padded = base64.padEnd(
                base64.length + ((4 - (base64.length % 4)) % 4),
                '='
            );

            return JSON.parse(atob(padded));
        } catch {
            return null;
        }
    }

    private loadAuthorities(token: string): void {
        const data = this.decodePayload(token);

        if (!data) {
            this.rolesSubject.next([]);
            this.permissionsSubject.next([]);
            return;
        }

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
    }
}
