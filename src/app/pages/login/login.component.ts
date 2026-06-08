import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AdminAuthService } from '../../core/auth/admin-auth.service';

type Tab = 'login' | 'register';
type RegisterState = 'form' | 'setup_done';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly fb     = inject(FormBuilder);
  private readonly auth   = inject(AdminAuthService);
  private readonly router = inject(Router);

  activeTab:     Tab           = 'login';
  registerState: RegisterState = 'form';
  showPwd    = false;
  showRegPwd = false;

  readonly loading = signal(false);
  readonly error   = signal('');
  readonly success = signal('');

  readonly loginForm = this.fb.nonNullable.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  readonly registerForm = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName:  ['', [Validators.required, Validators.minLength(2)]],
    email:     ['', [Validators.required, Validators.email]],
    password:  ['', [Validators.required, Validators.minLength(8)]],
  });

  /** 0-100 password strength score */
  get pwdStrength(): number {
    const pwd: string = this.registerForm.get('password')?.value ?? '';
    if (!pwd) return 0;
    let score = 0;
    if (pwd.length >= 8)  score += 25;
    if (pwd.length >= 12) score += 15;
    if (/[A-Z]/.test(pwd)) score += 20;
    if (/[0-9]/.test(pwd)) score += 20;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 20;
    return Math.min(score, 100);
  }

  setTab(tab: Tab): void {
    this.activeTab = tab;
    this.error.set('');
    this.success.set('');
    if (tab === 'register') this.registerState = 'form';
  }

  goToLogin(): void {
    this.setTab('login');
  }

  async submitLogin(): Promise<void> {
    this.error.set('');
    if (this.loginForm.invalid) return;
    this.loading.set(true);
    try {
      const { email, password } = this.loginForm.getRawValue();
      await this.auth.login(email, password);
      await this.router.navigateByUrl('/dashboard');
    } catch (e: unknown) {
      const code = e instanceof Error ? e.message : '';
      if (code === 'NETWORK_ERROR') {
        this.error.set('Impossible de joindre le serveur. Vérifiez votre connexion.');
      } else {
        this.error.set(code || 'Connexion impossible');
      }
    } finally {
      this.loading.set(false);
    }
  }

  async submitRegister(): Promise<void> {
    this.error.set('');
    this.success.set('');
    if (this.registerForm.invalid) return;
    this.loading.set(true);
    try {
      const v = this.registerForm.getRawValue();
      await this.auth.register(v.firstName, v.lastName, v.email, v.password);
      this.success.set('Compte admin créé avec succès ! Vous pouvez maintenant vous connecter.');
      this.registerForm.reset();
      setTimeout(() => this.setTab('login'), 2500);
    } catch (e: unknown) {
      const code = e instanceof Error ? e.message : '';
      if (code === 'SETUP_DONE') {
        this.registerState = 'setup_done';
        this.error.set('');
      } else if (code === 'EMAIL_TAKEN') {
        this.error.set('Cette adresse e-mail est déjà utilisée.');
      } else if (code === 'NETWORK_ERROR') {
        this.error.set('Impossible de joindre le serveur. Vérifiez que le backend est démarré.');
      } else {
        this.error.set(code || 'Inscription impossible. Réessayez.');
      }
    } finally {
      this.loading.set(false);
    }
  }
}
