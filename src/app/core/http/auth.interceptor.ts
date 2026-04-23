import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { AdminAuthService } from '../auth/admin-auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AdminAuthService);
  const token = auth.getToken();
  if (token) {
    return next(
      req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }),
    );
  }
  return next(req);
};
