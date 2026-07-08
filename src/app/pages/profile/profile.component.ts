import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AdminAuthService } from '../../core/auth/admin-auth.service';
import { SchoolOut, UserOut } from '../../core/models/user.model';
import { PhoneInputComponent } from '../../shared/phone-input/phone-input.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    DatePipe,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDatepickerModule,
    MatNativeDateModule,
    PhoneInputComponent,
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AdminAuthService);

  readonly loading = signal(true);
  readonly savingProfile = signal(false);
  readonly savingPassword = signal(false);
  readonly profileError = signal('');
  readonly passwordError = signal('');
  readonly passwordSuccess = signal('');
  readonly profileSuccess = signal('');
  readonly schoolProfile = signal<SchoolOut | null>(null);
  readonly userProfile = signal<UserOut | null>(null);

  readonly maxDate = new Date();
  hideOld = true;
  hideNew = true;
  hideConfirm = true;

  readonly profileForm = this.fb.group({
    firstName: [''],
    lastName: [''],
    phone: [''],
    dateOfBirth: this.fb.control<Date | null>(null),
    name: [''],
    address: [''],
    city: [''],
    postalCode: [''],
    directorName: [''],
  });

  readonly passwordForm = this.fb.nonNullable.group({
    oldPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required],
  }, { validators: passwordMatchValidator });

  get isSchool(): boolean {
    return this.auth.isSchool();
  }

  get roleLabel(): string {
    const role = this.auth.user()?.role;
    if (role === 'school') return 'Établissement';
    if (role === 'prof') return 'Professeur';
    return 'Administrateur';
  }

  async ngOnInit(): Promise<void> {
    await this.loadProfile();
  }

  async loadProfile(): Promise<void> {
    this.loading.set(true);
    this.profileError.set('');
    try {
      const data = await this.auth.fetchProfile();
      if (this.isSchool) {
        const school = data as SchoolOut;
        this.schoolProfile.set(school);
        this.profileForm.patchValue({
          name: school.name,
          address: school.address ?? '',
          city: school.city ?? '',
          postalCode: school.postalCode ?? '',
          phone: school.phone ?? '',
          directorName: school.directorName ?? '',
        });
      } else {
        const user = data as UserOut;
        this.userProfile.set(user);
        this.profileForm.patchValue({
          firstName: user.firstName ?? '',
          lastName: user.lastName ?? '',
          phone: (user as UserOut & { phone?: string }).phone ?? '',
          dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth) : null,
        });
      }
    } catch (e: unknown) {
      this.profileError.set(e instanceof Error ? e.message : 'Erreur de chargement');
    } finally {
      this.loading.set(false);
    }
  }

  async saveProfile(): Promise<void> {
    this.savingProfile.set(true);
    this.profileError.set('');
    this.profileSuccess.set('');
    try {
      const v = this.profileForm.getRawValue();
      if (this.isSchool) {
        await this.auth.updateProfile({
          name: v.name || undefined,
          address: v.address || null,
          city: v.city || null,
          postalCode: v.postalCode || null,
          phone: v.phone || null,
          directorName: v.directorName || null,
        });
      } else {
        const dateOfBirth = v.dateOfBirth instanceof Date
          ? v.dateOfBirth.toISOString().split('T')[0]
          : null;
        await this.auth.updateProfile({
          firstName: v.firstName || undefined,
          lastName: v.lastName || undefined,
          phone: v.phone || null,
          dateOfBirth,
        });
      }
      this.profileSuccess.set('Profil mis à jour avec succès.');
      await this.loadProfile();
    } catch (e: unknown) {
      this.profileError.set(e instanceof Error ? e.message : 'Erreur de sauvegarde');
    } finally {
      this.savingProfile.set(false);
    }
  }

  async savePassword(): Promise<void> {
    if (this.passwordForm.invalid) return;
    this.savingPassword.set(true);
    this.passwordError.set('');
    this.passwordSuccess.set('');
    try {
      const v = this.passwordForm.getRawValue();
      await this.auth.changePassword(v.oldPassword, v.newPassword);
      this.passwordSuccess.set('Mot de passe modifié avec succès.');
      this.passwordForm.reset();
    } catch (e: unknown) {
      this.passwordError.set(e instanceof Error ? e.message : 'Erreur de changement de mot de passe');
    } finally {
      this.savingPassword.set(false);
    }
  }
}

function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const newPassword = control.get('newPassword')?.value as string | undefined;
  const confirmPassword = control.get('confirmPassword')?.value as string | undefined;
  if (!newPassword || !confirmPassword) return null;
  return newPassword === confirmPassword ? null : { mismatch: true };
}
