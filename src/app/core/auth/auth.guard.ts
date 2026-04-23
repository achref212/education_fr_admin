import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';

import { AdminAuthService } from './admin-auth.service';

export const adminAuthGuard: CanActivateFn = () => {
  const auth = inject(AdminAuthService);
  const router = inject(Router);
  if (auth.isLoggedIn() && auth.isAdmin()) {
    return true;
  }
  return router.createUrlTree(['/login']);
};

export const loginPageGuard: CanActivateFn = () => {
  const auth = inject(AdminAuthService);
  const router = inject(Router);
  if (auth.isLoggedIn() && auth.isAdmin()) {
    return router.createUrlTree(['/dashboard']);
  }
  return true;
};
