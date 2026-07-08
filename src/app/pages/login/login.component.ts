import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AdminAuthService } from '../../core/auth/admin-auth.service';
import { PhoneInputComponent } from '../../shared/phone-input/phone-input.component';

import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

type Tab = 'login' | 'register';
type AuthView = Tab | 'forgot';
type ForgotStep = 1 | 2 | 3;

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
    MatDatepickerModule,
    MatNativeDateModule,
    PhoneInputComponent,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  private readonly fb     = inject(FormBuilder);
  private readonly auth   = inject(AdminAuthService);
  private readonly router = inject(Router);

  activeTab: Tab = 'login';
  authView: AuthView = 'login';
  forgotStep: ForgotStep = 1;
  showPwd    = false;
  showRegPwd = false;
  showForgotPwd = false;
  showForgotConfirm = false;

  private resetStateToken = '';
  private resetToken = '';
  private forgotEmail = '';

  readonly loading = signal(false);
  readonly checkingSetup = signal(true);
  readonly setupComplete = signal(true);
  readonly error   = signal('');
  readonly success = signal('');

  readonly loginForm = this.fb.nonNullable.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  readonly maxDate = new Date();

  readonly forgotEmailForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  readonly forgotCodeForm = this.fb.nonNullable.group({
    code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
  });

  readonly forgotPasswordForm = this.fb.nonNullable.group({
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required],
  });

  readonly registerForm = this.fb.group({
    firstName: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(2)]),
    lastName: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(2)]),
    email: this.fb.nonNullable.control('', [Validators.required, Validators.email]),
    password: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(8)]),
    phone: this.fb.nonNullable.control(''),
    dateOfBirth: this.fb.control<Date | null>(null),
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

  async ngOnInit(): Promise<void> {
    try {
      const complete = await this.auth.isSetupComplete();
      this.setupComplete.set(complete);
      if (!complete) {
        this.activeTab = 'register';
        this.authView = 'register';
      }
    } catch {
      this.setupComplete.set(false);
      this.activeTab = 'register';
      this.authView = 'register';
    } finally {
      this.checkingSetup.set(false);
    }
  }

  setTab(tab: Tab): void {
    if (tab === 'register' && this.setupComplete()) return;
    if (tab === 'login' && !this.setupComplete()) return;
    this.activeTab = tab;
    this.authView = tab;
    this.error.set('');
    this.success.set('');
  }

  openForgotPassword(): void {
    this.authView = 'forgot';
    this.forgotStep = 1;
    this.resetStateToken = '';
    this.resetToken = '';
    this.forgotEmail = '';
    this.error.set('');
    this.success.set('');
    this.forgotEmailForm.reset();
    this.forgotCodeForm.reset();
    this.forgotPasswordForm.reset();
    const loginEmail = this.loginForm.get('email')?.value;
    if (loginEmail) {
      this.forgotEmailForm.patchValue({ email: loginEmail });
    }
  }

  backToLogin(): void {
    this.authView = 'login';
    this.activeTab = 'login';
    this.forgotStep = 1;
    this.error.set('');
    this.success.set('');
  }

  async submitForgotEmail(): Promise<void> {
    this.error.set('');
    if (this.forgotEmailForm.invalid) return;
    this.loading.set(true);
    try {
      const { email } = this.forgotEmailForm.getRawValue();
      this.forgotEmail = email;
      const token = await this.auth.requestPasswordReset(email);
      if (token) {
        this.resetStateToken = token;
      }
      this.forgotStep = 2;
      this.success.set('Un code de vérification a été envoyé à votre adresse e-mail.');
    } catch (e: unknown) {
      this.error.set(e instanceof Error ? e.message : 'Impossible d\'envoyer le code');
    } finally {
      this.loading.set(false);
    }
  }

  async submitForgotCode(): Promise<void> {
    this.error.set('');
    this.success.set('');
    if (this.forgotCodeForm.invalid) return;
    this.loading.set(true);
    try {
      const { code } = this.forgotCodeForm.getRawValue();
      this.resetToken = await this.auth.verifyResetCode(
        this.forgotEmail,
        code,
        this.resetStateToken,
      );
      this.forgotStep = 3;
    } catch (e: unknown) {
      this.error.set(e instanceof Error ? e.message : 'Code invalide ou expiré');
    } finally {
      this.loading.set(false);
    }
  }

  async submitForgotPassword(): Promise<void> {
    this.error.set('');
    this.success.set('');
    const v = this.forgotPasswordForm.getRawValue();
    if (v.newPassword !== v.confirmPassword) {
      this.error.set('Les mots de passe ne correspondent pas.');
      return;
    }
    if (this.forgotPasswordForm.invalid) return;
    this.loading.set(true);
    try {
      await this.auth.resetPassword(this.forgotEmail, this.resetToken, v.newPassword);
      this.success.set('Mot de passe réinitialisé ! Vous pouvez vous connecter.');
      this.loginForm.patchValue({ email: this.forgotEmail, password: '' });
      setTimeout(() => this.backToLogin(), 2500);
    } catch (e: unknown) {
      this.error.set(e instanceof Error ? e.message : 'Réinitialisation impossible');
    } finally {
      this.loading.set(false);
    }
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
      const dateOfBirth = v.dateOfBirth instanceof Date
        ? v.dateOfBirth.toISOString().split('T')[0]
        : undefined;
      await this.auth.register(v.firstName, v.lastName, v.email, v.password, v.phone, dateOfBirth);
      this.setupComplete.set(true);
      this.success.set('Compte admin créé avec succès ! Vous pouvez maintenant vous connecter.');
      this.registerForm.reset();
      setTimeout(() => this.setTab('login'), 2500);
    } catch (e: unknown) {
      const code = e instanceof Error ? e.message : '';
      if (code === 'SETUP_DONE') {
        this.setupComplete.set(true);
        this.setTab('login');
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
