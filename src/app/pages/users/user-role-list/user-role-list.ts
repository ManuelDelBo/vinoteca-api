import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { UserService } from '../../../services/user.service';
import { User, Role } from '../../../models/user';
import { ModalService } from '../../../shared/modal/modal.service';

@Component({
    imports: [RouterLink],
    selector: 'app-user-role-list',
    styleUrl: './user-role-list.css',
    templateUrl: './user-role-list.html',
})
export class UserRoleList implements OnInit {

    users = signal<User[]>([]);
    role: Role = 'ROLE_ADMIN';
    title = '';
    mensaje = signal('');
    showingInactive = signal(false);

    private modal = inject(ModalService);

    constructor(
        private userService: UserService,
        private route: ActivatedRoute
    ) {}

    ngOnInit(): void {
        this.role = this.route.snapshot.data['role'];
        this.setTitle();
        this.loadUsers();
    }

    setTitle(): void {
        switch (this.role) {
            case 'ROLE_ADMIN':
                this.title = 'Administradores';
                break;
            case 'ROLE_EMPLOYEE':
                this.title = 'Empleados';
                break;
            case 'ROLE_CUSTOMER':
                this.title = 'Clientes';
                break;
        }
    }

    loadUsers(): void {
        this.mensaje.set('');

        const request = this.showingInactive()
            ? this.userService.getInactiveUsers()
            : this.userService.getUsers();

        request.subscribe({
            next: data => {
                this.users.set(
                    data.filter(user => user.roles.includes(this.role))
                );
            },
            error: () => {
                this.mensaje.set('No se pudieron cargar los usuarios.');
            }
        });
    }

    toggleInactive(): void {
        this.showingInactive.update(value => !value);
        this.loadUsers();
    }

    async deleteUser(user: User): Promise<void> {
        const confirmed = await this.modal.confirm({
            title: 'Deshabilitar usuario',
            message: `¿Estás seguro de deshabilitar a ${user.name} ${user.lastName}?`,
            confirmLabel: 'Deshabilitar',
            cancelLabel: 'Cancelar',
            variant: 'danger'
        });

        if (!confirmed) {
            return;
        }

        this.userService.deleteUser(user.id).subscribe({
            next: () => {
                this.mensaje.set('Usuario deshabilitado correctamente.');
                this.loadUsers();
            },
            error: () => {
                this.mensaje.set('No se pudo deshabilitar el usuario.');
            }
        });
    }

    async activateUser(user: User): Promise<void> {
        const confirmed = await this.modal.confirm({
            title: 'Reactivar usuario',
            message: `¿Querés reactivar a ${user.name} ${user.lastName}?`,
            confirmLabel: 'Reactivar',
            cancelLabel: 'Cancelar',
            variant: 'confirm'
        });

        if (!confirmed) {
            return;
        }

        this.userService.activateUser(user.id).subscribe({
            next: () => {
                this.mensaje.set('Usuario reactivado correctamente.');
                this.loadUsers();
            },
            error: () => {
                this.mensaje.set('No se pudo reactivar el usuario.');
            }
        });
    }
}
