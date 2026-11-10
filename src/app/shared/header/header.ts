import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';


@Component({
  imports: [CommonModule, RouterLink],
  selector: 'app-header',
  styleUrl: './header.css',
  templateUrl: './header.html',
})
export class Header {

  readonly themeService: ThemeService = inject(ThemeService);
  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  get loggedIn$() {
    return this.authService.loggedIn$;
  }

  get isCustomer(): boolean {
    return this.authService.hasRole('ROLE_CUSTOMER');
  }

  get isAdminOrEmployee(): boolean {
    return this.authService.hasRole('ROLE_ADMIN') ||
      this.authService.hasRole('ROLE_EMPLOYEE');
  }

  onLogout(): void {
    const confirmar = confirm(
      '¿Estás segura de que querés cerrar sesión?'
    );

    if (!confirmar) {
      return;
    }

    this.authService.logout();
    this.router.navigate(['/']);
  }
}

