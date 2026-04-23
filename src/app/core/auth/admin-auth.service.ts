import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { TokenResponse, UserOut } from '../models/user.model';

const TOKEN_KEY = 'efr_admin_token';
const USER_KEY = 'efr_admin_user';

@Injectable({ providedIn: 'root' })
export class AdminAuthService {
  private readonly userSignal = signal<UserOut | null>(this.readUserFromStorage());

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router,
  ) {
    this.userSignal.set(this.readUserFromStorage());
  }

  user = this.userSignal.asReadonly();

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getToken() && !!this.userSignal();
  }

  isAdmin(): boolean {
    return this.userSignal()?.role === 'admin';
  }

  async login(email: string, password: string): Promise<void> {
    const res = await firstValueFrom(
      this.http.post<TokenResponse>(`${environment.apiUrl}/auth/login`, {
        email,
        password,
      }),
    );
    if (res.user.role !== 'admin') {
      throw new Error('Accès réservé aux administrateurs');
    }
    localStorage.setItem(TOKEN_KEY, res.access_token);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    this.userSignal.set(res.user);
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.userSignal.set(null);
    void this.router.navigate(['/login']);
  }

  private readUserFromStorage(): UserOut | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as UserOut;
    } catch {
      return null;
    }
  }
}
