import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const customerGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.hasRole('ROLE_CUSTOMER')) {
        return true;
    }

    if (!authService.isLoggedIn()) {
        return router.createUrlTree(['/login']);
    }

    return router.createUrlTree(['/']);
};
