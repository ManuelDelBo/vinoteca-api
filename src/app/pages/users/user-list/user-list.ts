import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UserService } from '../../../services/user.service';
import { User } from '../../../models/user';

@Component({
    imports: [RouterLink],
    selector: 'app-user-list',
    styleUrl: './user-list.css',
    templateUrl: './user-list.html',
})
export class UserList implements OnInit {

    users = signal<User[]>([]);

    adminCount = signal(0);
    employeeCount = signal(0);
    customerCount = signal(0);

    constructor(private userService: UserService) {}

    ngOnInit(): void {
        this.loadUsers();
    }

    loadUsers(): void {
        this.userService.getUsers().subscribe(data => {
            this.users.set(data);

            this.adminCount.set(
                data.filter(user => user.roles.includes('ROLE_ADMIN')).length
            );

            this.employeeCount.set(
                data.filter(user => user.roles.includes('ROLE_EMPLOYEE')).length
            );

            this.customerCount.set(
                data.filter(user => user.roles.includes('ROLE_CUSTOMER')).length
            );
        });
    }
}
