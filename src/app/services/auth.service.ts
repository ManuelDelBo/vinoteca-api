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

    login(credentials: AuthRequest): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(
            `${this.apiUrl}/login`,
            credentials
        ).pipe(
            tap(response => {
                localStorage.setItem('token', response.token);
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
    }

    getToken(): string | null {
        return localStorage.getItem('token');
    }

    isLoggedIn(): boolean {
        return !!this.getToken();
    }
}

