import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { SchoolOut, TokenResponse, UserOut } from '../models/user.model';

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

export interface ProfileUpdatePayload {
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  dateOfBirth?: string | null;
  name?: string;
  address?: string | null;
  city?: string | null;
  postalCode?: string | null;
  directorName?: string | null;
  profilePictureUrl?: string | null;
  logoUrl?: string | null;
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

  async isSetupComplete(): Promise<boolean> {
    try {
      const res = await firstValueFrom(
        this.http.get<{ setupComplete: boolean }>(`${environment.apiUrl}/admin/setup/status`),
      );
      return res.setupComplete;
    } catch (e: unknown) {
      if (e instanceof HttpErrorResponse && e.status === 0) {
        throw new Error('NETWORK_ERROR');
      }
      return false;
    }
  }

  async fetchProfile(): Promise<UserOut | SchoolOut> {
    try {
      if (this.isSchool()) {
        return await firstValueFrom(
          this.http.get<SchoolOut>(`${environment.apiUrl}/school/me`),
        );
      }
      return await firstValueFrom(
        this.http.get<UserOut>(`${environment.apiUrl}/auth/me`),
      );
    } catch (e: unknown) {
      throw parseHttpError(e);
    }
  }

  async updateProfile(payload: ProfileUpdatePayload): Promise<UserOut | SchoolOut> {
    try {
      if (this.isSchool()) {
        const school = await firstValueFrom(
          this.http.patch<SchoolOut>(`${environment.apiUrl}/school/me`, payload),
        );
        this.storeSchoolUser(school);
        return school;
      }
      const user = await firstValueFrom(
        this.http.patch<UserOut>(`${environment.apiUrl}/auth/me`, payload),
      );
      this.storeUserAccount(user);
      return user;
    } catch (e: unknown) {
      throw parseHttpError(e);
    }
  }

  async requestPasswordReset(email: string): Promise<string | null> {
    try {
      const res = await firstValueFrom(
        this.http.post<{ message: string; reset_state_token: string | null }>(
          `${environment.apiUrl}/auth/forgot-password`,
          { email },
        ),
      );
      return res.reset_state_token;
    } catch (e: unknown) {
      throw parseHttpError(e);
    }
  }

  async verifyResetCode(email: string, code: string, resetStateToken: string): Promise<string> {
    try {
      const res = await firstValueFrom(
        this.http.post<{ reset_token: string }>(
          `${environment.apiUrl}/auth/verify-reset-code`,
          { email, code, reset_state_token: resetStateToken },
        ),
      );
      return res.reset_token;
    } catch (e: unknown) {
      throw parseHttpError(e);
    }
  }

  async resetPassword(email: string, resetToken: string, newPassword: string): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post(`${environment.apiUrl}/auth/reset-password`, {
          email,
          reset_token: resetToken,
          new_password: newPassword,
        }),
      );
    } catch (e: unknown) {
      throw parseHttpError(e);
    }
  }

  async register(
    firstName: string,
    lastName: string,
    email: string,
    password: string,
    phone?: string,
    dateOfBirth?: string,
  ): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post(`${environment.apiUrl}/admin/setup`, {
          firstName,
          lastName,
          email,
          password,
          phone: phone || null,
          dateOfBirth: dateOfBirth || null,
          level: '2ème année',
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

      if (role === 'school' && res.school) {
        this.storeSchoolUser(res.school);
      } else if (res.user) {
        this.storeUserAccount(res.user);
      }

      localStorage.setItem(TOKEN_KEY, res.access_token);
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

  private storeUserAccount(user: UserOut): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this.userSignal.set(user);
  }

  private storeSchoolUser(school: SchoolOut): void {
    const accountData: UserOut = {
      id: school.id,
      email: school.email,
      name: school.name,
      firstName: school.name,
      lastName: '',
      role: 'school',
      isActive: school.isActive,
      mustChangePassword: school.mustChangePassword,
      createdAt: school.createdAt,
      profilePictureUrl: school.logoUrl ?? null,
    };
    localStorage.setItem(USER_KEY, JSON.stringify(accountData));
    this.userSignal.set(accountData);
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
