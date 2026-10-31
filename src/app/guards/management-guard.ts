
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const managementGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const isAdmin = authService.hasRole('ROLE_ADMIN');
    const isEmployee = authService.hasRole('ROLE_EMPLOYEE');

    if (isAdmin || isEmployee) {
        return true;
    }

    return router.createUrlTree(['/']);
};

