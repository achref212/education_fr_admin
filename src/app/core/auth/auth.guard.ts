import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';

import { AdminAuthService } from './admin-auth.service';

export const adminAuthGuard: CanActivateFn = () => {
  const auth = inject(AdminAuthService);
  const router = inject(Router);
  if (auth.isLoggedIn() && (auth.isAdmin() || auth.isSchool() || auth.isProf())) {
    return true;
  }
  return router.createUrlTree(['/login']);
};

export const loginPageGuard: CanActivateFn = () => {
  const auth = inject(AdminAuthService);
  const router = inject(Router);
  if (auth.isLoggedIn() && (auth.isAdmin() || auth.isSchool() || auth.isProf())) {
    return router.createUrlTree(['/dashboard']);
  }
  return true;
};

export const schoolRoleGuard: CanActivateFn = () => {
  const auth = inject(AdminAuthService);
  const router = inject(Router);
  if (auth.isSchool()) return true;
  if (auth.isLoggedIn()) return router.createUrlTree(['/dashboard']);
  return router.createUrlTree(['/login']);
};

export const adminRoleGuard: CanActivateFn = () => {
  const auth = inject(AdminAuthService);
  const router = inject(Router);
  if (auth.isAdmin()) return true;
  if (auth.isLoggedIn()) return router.createUrlTree(['/dashboard']);
  return router.createUrlTree(['/login']);
};
