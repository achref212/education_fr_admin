import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { TokenResponse, UserOut } from '../models/user.model';

const TOKEN_KEY = 'efr_admin_token';
const USER_KEY  = 'efr_admin_user';

function parseHttpError(e: unknown): Error {
  if (e instanceof HttpErrorResponse) {
    const detail: string | undefined = e.error?.detail;
    if (e.status === 0) return new Error('NETWORK_ERROR');
    if (e.status === 403) return new Error('SETUP_DONE');
    if (e.status === 409) return new Error('EMAIL_TAKEN');
    if (detail?.includes('Setup already completed')) return new Error('SETUP_DONE');
    if (detail?.includes('déjà utilisé')) return new Error('EMAIL_TAKEN');
    if (detail) return new Error(detail);
    return new Error(`Erreur ${e.status}: ${e.statusText}`);
  }
  if (e instanceof Error) return e;
  return new Error('Erreur inconnue');
}

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

  isSchool(): boolean {
    return this.userSignal()?.role === 'school';
  }

  isProf(): boolean {
    return this.userSignal()?.role === 'prof';
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post(`${environment.apiUrl}/auth/change-password`, {
          oldPassword,
          newPassword,
        })
      );
      const user = this.userSignal();
      if (user) {
        const updatedUser = { ...user, mustChangePassword: false };
        this.userSignal.set(updatedUser);
        localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
      }
    } catch (e: unknown) {
      throw parseHttpError(e);
    }
  }

  /**
   * Creates the first admin account via POST /admin/setup.
   * Only works when no admin exists yet.
   * Throws with a code string (SETUP_DONE | EMAIL_TAKEN | NETWORK_ERROR)
   * so the UI can display a localized message.
   */
  async register(
    firstName: string,
    lastName: string,
    email: string,
    password: string,
  ): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post(`${environment.apiUrl}/admin/setup`, {
          firstName,
          lastName,
          email,
          password,
          level: '2e année primaire',
        }),
      );
    } catch (e: unknown) {
      throw parseHttpError(e);
    }
  }

  async login(email: string, password: string): Promise<void> {
    try {
      const res = await firstValueFrom(
        this.http.post<TokenResponse>(`${environment.apiUrl}/auth/login`, {
          email,
          password,
        }),
      );
      
      const role = res.role;
      if (role !== 'admin' && role !== 'school' && role !== 'prof') {
        throw new Error('Accès non autorisé au panel d\'administration');
      }
      
      const accountData: UserOut = role === 'school' && res.school 
        ? { 
            id: res.school.id, 
            email: res.school.email, 
            name: res.school.name,
            firstName: res.school.name,
            lastName: '',
            role: 'school', 
            isActive: res.school.isActive, 
            mustChangePassword: res.school.mustChangePassword,
            createdAt: res.school.createdAt 
          }
        : res.user!;

      localStorage.setItem(TOKEN_KEY, res.access_token);
      localStorage.setItem(USER_KEY, JSON.stringify(accountData));
      this.userSignal.set(accountData);
    } catch (e: unknown) {
      if (e instanceof Error && e.message === 'Accès non autorisé au panel d\'administration') throw e;
      throw parseHttpError(e);
    }
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
