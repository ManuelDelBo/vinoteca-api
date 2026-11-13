import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { Observable, of } from 'rxjs';
import { signal } from '@angular/core';

import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { Header } from './header';

describe('Header', () => {
  let fixture: ComponentFixture<Header>;
  let authService: {
    loggedIn$: Observable<boolean>;
    isLoggedIn: ReturnType<typeof vi.fn>;
    hasRole: ReturnType<typeof vi.fn>;
    logout: ReturnType<typeof vi.fn>;
  };
  let router: Router;

  const configure = async (roles: string[], loggedIn: boolean) => {
    authService = {
      loggedIn$: of(loggedIn),
      isLoggedIn: vi.fn().mockReturnValue(loggedIn),
      hasRole: vi.fn().mockImplementation((role: string) => roles.includes(role)),
      logout: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [Header],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authService },
        {
          provide: ThemeService,
          useValue: {
            theme: signal('light'),
            toggleTheme: vi.fn()
          }
        }
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(Header);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  it('should show a visible login button and registration link for guests', async () => {
    await configure([], false);

    const element = fixture.nativeElement as HTMLElement;
    const loginLink = element.querySelector('.login-link') as HTMLAnchorElement;

    expect(element.querySelector('.cart-link')).toBeNull();
    expect(element.querySelector('.profile-toggle')).toBeNull();
    expect(loginLink).not.toBeNull();
    expect(loginLink.textContent).toContain('Iniciar sesión');
    expect(loginLink.getAttribute('href')).toBe('/login');
    expect(element.textContent).toContain('Registrarse');
  });

  it('should not show the guest login button when the session is active', async () => {
    await configure(['ROLE_CUSTOMER'], true);

    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('.login-link')).toBeNull();
    expect(element.querySelector('.profile-toggle')).not.toBeNull();
  });

  it('should show the cart icon for customers', async () => {
    await configure(['ROLE_CUSTOMER'], true);

    const element = fixture.nativeElement as HTMLElement;
    const cart = element.querySelector('.cart-link');

    expect(cart).not.toBeNull();
    expect(cart?.getAttribute('aria-label')).toBe('Mi carrito');
  });

  it('should open the profile menu with the customer options', async () => {
    await configure(['ROLE_CUSTOMER'], true);

    const element = fixture.nativeElement as HTMLElement;
    const toggle = element.querySelector('.profile-toggle') as HTMLButtonElement;

    expect(toggle.getAttribute('aria-haspopup')).toBe('menu');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');

    toggle.click();
    fixture.detectChanges();

    expect(toggle.getAttribute('aria-expanded')).toBe('true');

    const dropdown = element.querySelector('.profile-dropdown');
    expect(dropdown).not.toBeNull();
    expect(dropdown?.textContent).toContain('Mi perfil');
    expect(dropdown?.textContent).toContain('Mis pedidos');
    expect(dropdown?.textContent).toContain('Editar perfil');
    expect(dropdown?.textContent).toContain('Salir');
  });

  it('should hide customer-only options for staff', async () => {
    await configure(['ROLE_ADMIN'], true);

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('.cart-link')).toBeNull();

    (element.querySelector('.profile-toggle') as HTMLButtonElement).click();
    fixture.detectChanges();

    const dropdown = element.querySelector('.profile-dropdown');
    expect(dropdown?.textContent).toContain('Mi perfil');
    expect(dropdown?.textContent).not.toContain('Mis pedidos');
    expect(dropdown?.textContent).not.toContain('Editar perfil');
    expect(element.textContent).toContain('Gestión interna');
  });

  it('should ask for confirmation before logging out', async () => {
    await configure(['ROLE_CUSTOMER'], true);

    const element = fixture.nativeElement as HTMLElement;
    (element.querySelector('.profile-toggle') as HTMLButtonElement).click();
    fixture.detectChanges();

    const logout = Array.from(
      element.querySelectorAll<HTMLButtonElement>('.dropdown-logout')
    )[0];

    logout.click();
    fixture.detectChanges();

    expect(element.querySelector('app-confirm-dialog')).not.toBeNull();
    expect(authService.logout).not.toHaveBeenCalled();

    const confirmButton = element.querySelector(
      'app-confirm-dialog .btn-confirm'
    ) as HTMLButtonElement;

    confirmButton.click();
    fixture.detectChanges();

    expect(authService.logout).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });
});
