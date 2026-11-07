import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../../../services/user.service';
import { UserRequest } from '../../../models/user';

@Component({
    imports: [FormsModule],
    selector: 'app-user-form',
    styleUrl: './user-form.css',
    templateUrl: './user-form.html',
})
export class UserForm {
    errorMessage = '';

    user: UserRequest = {
        email: '',
        name: '',
        lastName: '',
        password: '',
        role: 'ROLE_EMPLOYEE'
    };

    title = '';

    constructor(
        private userService: UserService,
        private route: ActivatedRoute,
        private router: Router
    ) {
        const role = this.route.snapshot.paramMap.get('role');

        if (role === 'admin') {
            this.user.role = 'ROLE_ADMIN';
            this.title = 'Agregar administrador';
        } else if (role === 'employee') {
            this.user.role = 'ROLE_EMPLOYEE';
            this.title = 'Agregar empleado';
        }
    }

    saveUser(form: any): void {
        this.errorMessage = '';

        if (form.invalid) {
            form.control.markAllAsTouched();
            return;
        }

        this.userService.createUser(this.user).subscribe({
            next: () => {
                const section = this.user.role === 'ROLE_ADMIN' ? 'admin' : 'employee';
                this.router.navigate(['/management/users', section]);
            },
            error: (error) => {
                if (error.status === 409) {
                    this.errorMessage = error.error || 'El correo electrónico ya está registrado.';
                } else {
                    this.errorMessage = 'No se pudo crear el usuario. Intentá nuevamente.';
                }
            }
        });
    }

    cancel(): void {
        const section = this.user.role === 'ROLE_ADMIN' ? 'admin' : 'employee';
        this.router.navigate(['/management/users', section]);
    }
}
