import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { map, Observable } from 'rxjs';
import { User, UserRequest } from '../models/user';

@Service()
export class UserService {

    private http = inject(HttpClient);
    private url = 'http://localhost:8081/api/users';

    getUsers(): Observable<User[]> {
        return this.http.get<User[]>(this.url).pipe(
            map(users => users.map(user => ({
                ...user,
                id: user.id ?? (user as any).externalId
            })))
        );
    }

    getInactiveUsers(): Observable<User[]> {
        return this.http.get<User[]>(`${this.url}/inactive`).pipe(
            map(users => users.map(user => ({
                ...user,
                id: user.id ?? (user as any).externalId
            })))
        );
    }

    getUserById(id: string): Observable<User> {
        return this.http.get<any>(`${this.url}/${id}`).pipe(
            map(user => ({
                ...user,
                id: user.externalId
            }))
        );
    }

    createUser(user: UserRequest): Observable<User> {
        return this.http.post<User>(this.url, user);
    }

    deleteUser(id: string): Observable<void> {
        return this.http.delete<void>(`${this.url}/${id}`);
    }

    activateUser(id: string): Observable<void> {
        return this.http.patch<void>(`${this.url}/${id}/activate`, {});
    }
}
