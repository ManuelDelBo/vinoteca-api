import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  HostListener,
  ViewChild,
  inject,
  signal
} from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { ConfirmDialog } from '../confirm-dialog/confirm-dialog';


@Component({
  imports: [CommonModule, RouterLink, RouterLinkActive, ConfirmDialog],
  selector: 'app-header',
  styleUrl: './header.css',
  templateUrl: './header.html',
})
export class Header {

  readonly themeService: ThemeService = inject(ThemeService);

  @ViewChild('profileMenu')
  private profileMenu?: ElementRef<HTMLElement>;

  profileMenuOpen = signal(false);
  showLogoutDialog = signal(false);

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  get loggedIn$() {
    return this.authService.loggedIn$;
  }

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  get isCustomer(): boolean {
    return this.authService.hasRole('ROLE_CUSTOMER');
  }

  get isAdminOrEmployee(): boolean {
    return this.authService.hasRole('ROLE_ADMIN') ||
      this.authService.hasRole('ROLE_EMPLOYEE');
  }

  toggleProfileMenu(): void {
    this.profileMenuOpen.update(open => !open);
  }

  closeProfileMenu(): void {
    if (this.profileMenuOpen()) {
      this.profileMenuOpen.set(false);
    }
  }

  onProfileMenuKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.closeProfileMenu();
    }
  }

  requestLogout(): void {
    this.closeProfileMenu();
    this.showLogoutDialog.set(true);
  }

  cancelLogout(): void {
    this.showLogoutDialog.set(false);
  }

  confirmLogout(): void {
    this.showLogoutDialog.set(false);
    this.authService.logout();
    this.router.navigate(['/']);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.profileMenuOpen()) {
      return;
    }

    const target = event.target as Node | null;
    const menu = this.profileMenu?.nativeElement;

    if (menu && target && !menu.contains(target)) {
      this.closeProfileMenu();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeProfileMenu();
  }
}
