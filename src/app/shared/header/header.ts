import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  imports: [CommonModule, RouterLink],
  selector: 'app-header',
  styleUrl: './header.css',
  templateUrl: './header.html',
})
export class Header {
  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  get loggedIn$() {
    return this.authService.loggedIn$;
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

