import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder, ReactiveFormsModule, Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

import { AdminAuthService } from '../../core/auth/admin-auth.service';
import { AdminUserOut } from '../../core/models/user.model';
import { ApiService } from '../../core/http/api.service';
import { LEVELS } from '../../core/constants/form-options';
import { PhoneInputComponent } from '../../shared/phone-input/phone-input.component';

@Component({
  selector: 'app-user-create-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatDialogModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatRadioModule, MatButtonModule,
    MatIconModule, MatProgressSpinnerModule,
    MatDatepickerModule, MatNativeDateModule,
    PhoneInputComponent,
  ],
  template: `
    <div class="fd-wrap">
      <!-- header -->
      <div class="fd-header" style="background:linear-gradient(135deg,#ec4899,#f97316)">
        <div class="fd-header-icon"><mat-icon>person_add</mat-icon></div>
        <div class="fd-header-text">
          <h2 class="fd-title">{{ isSchool ? 'Nouveau professeur' : 'Nouvel utilisateur' }}</h2>
          <span class="fd-sub">Créer un compte sur la plateforme</span>
        </div>
        <button class="fd-close" mat-dialog-close type="button"><mat-icon>close</mat-icon></button>
      </div>

      <!-- body -->
      <div class="fd-body">
        <form [formGroup]="form" (ngSubmit)="save()">

          <!-- name row -->
          <div class="fd-row">
            <mat-form-field appearance="outline" class="fd-field">
              <mat-label>Prénom</mat-label>
              <mat-icon matPrefix>badge</mat-icon>
              <input matInput formControlName="firstName" placeholder="Jean" />
            </mat-form-field>
            <mat-form-field appearance="outline" class="fd-field">
              <mat-label>Nom</mat-label>
              <input matInput formControlName="lastName" placeholder="Dupont" />
            </mat-form-field>
          </div>

          <!-- email -->
          <mat-form-field appearance="outline" class="fd-full">
            <mat-label>Adresse e-mail</mat-label>
            <mat-icon matPrefix>email</mat-icon>
            <input matInput type="email" formControlName="email"
                   placeholder="jean.dupont@exemple.com" />
          </mat-form-field>

          <!-- password (admin only) -->
          @if (!isSchool) {
            <mat-form-field appearance="outline" class="fd-full">
              <mat-label>Mot de passe</mat-label>
              <mat-icon matPrefix>lock</mat-icon>
              <input matInput [type]="showPwd ? 'text' : 'password'"
                     formControlName="password" />
              <button matSuffix mat-icon-button type="button"
                      (click)="showPwd = !showPwd">
                <mat-icon>{{ showPwd ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              <mat-hint>Minimum 6 caractères</mat-hint>
            </mat-form-field>
          }

          <!-- level (admin only) -->
          @if (!isSchool) {
            <mat-form-field appearance="outline" class="fd-full">
              <mat-label>Niveau scolaire</mat-label>
              <mat-icon matPrefix>school</mat-icon>
              <mat-select formControlName="level">
                @for (lvl of levels; track lvl) {
                  <mat-option [value]="lvl">{{ lvl }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
          }

          <!-- extra fields: date of birth + phone (admin creating a user) -->
          @if (!isSchool) {
            <mat-form-field appearance="outline" class="fd-full" (click)="dobPicker.open()">
              <mat-label>Date de naissance</mat-label>
              <mat-icon matPrefix>cake</mat-icon>
              <input matInput [matDatepicker]="dobPicker" formControlName="dateOfBirth"
                     [max]="maxDate" placeholder="jj/mm/aaaa" />
              <mat-datepicker-toggle matIconSuffix [for]="dobPicker"></mat-datepicker-toggle>
              <mat-datepicker #dobPicker panelClass="birthday-panel"></mat-datepicker>
            </mat-form-field>

            <div class="fd-phone-block">
              <span class="field-section-label">
                <mat-icon>phone</mat-icon>Téléphone
              </span>
              <app-phone-input formControlName="phone"></app-phone-input>
            </div>
          }

          <!-- role radio (admin only) -->
          @if (!isSchool) {
            <div class="fd-radio-group">
              <span class="fd-radio-label">
                <mat-icon>admin_panel_settings</mat-icon>
                Rôle du compte
              </span>
              <mat-radio-group formControlName="role" class="fd-radios">
                <label class="fd-radio-card" [class.selected]="form.get('role')?.value === 'user'">
                  <mat-radio-button value="user" color="primary"></mat-radio-button>
                  <div class="fd-radio-info">
                    <mat-icon class="fd-radio-icon" style="color:#06b6d4">person</mat-icon>
                    <span class="fd-radio-name">Utilisateur</span>
                    <span class="fd-radio-desc">Accès élève — apprend sur la plateforme</span>
                  </div>
                </label>
                <label class="fd-radio-card" [class.selected]="form.get('role')?.value === 'admin'">
                  <mat-radio-button value="admin" color="primary"></mat-radio-button>
                  <div class="fd-radio-info">
                    <mat-icon class="fd-radio-icon" style="color:#a855f7">shield</mat-icon>
                    <span class="fd-radio-name">Administrateur</span>
                    <span class="fd-radio-desc">Accès complet au tableau de bord</span>
                  </div>
                </label>
              </mat-radio-group>
            </div>
          } @else {
            <div class="info-alert">
              <mat-icon>info</mat-icon>
              Un e-mail contenant le mot de passe généré sera envoyé au professeur.
            </div>
          }

          @if (error) {
            <div class="fd-error"><mat-icon>error_outline</mat-icon>{{ error }}</div>
          }
        </form>
      </div>

      <!-- footer -->
      <div class="fd-footer">
        <button class="fd-btn-cancel" mat-dialog-close type="button">Annuler</button>
        <button class="fd-btn-save" type="button" (click)="save()"
                [disabled]="form.invalid || saving">
          @if (saving) { <mat-spinner diameter="18" class="fd-spinner"></mat-spinner> }
          @else { <mat-icon>{{ isSchool ? 'person_add' : 'person_add' }}</mat-icon> }
          {{ isSchool ? 'Créer le professeur' : 'Créer l\'utilisateur' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    @use '../../shared/form-dialog';

    .field-section-label {
      display: flex; align-items: center; gap: 5px;
      font-size: 12px; font-weight: 700; text-transform: uppercase;
      letter-spacing: .06em; color: var(--clr-text-muted);
      mat-icon { font-size: 14px; width: 14px; height: 14px; }
    }
    .fd-phone-block {
      display: flex;
      flex-direction: column;
      gap: 6px;
      width: 100%;
    }

    .info-alert {
      display: flex; align-items: center; gap: 8px;
      padding: 12px 16px; border-radius: 12px; margin-top: 12px;
      background: rgba(99,102,241,.07); border: 1px solid rgba(99,102,241,.18);
      color: var(--clr-text-muted); font-size: 13px;
      mat-icon { font-size: 18px; width: 18px; height: 18px; color: #818cf8; flex-shrink: 0; }
    }
  `],
})
export class UserCreateDialogComponent implements OnInit {
  private readonly api  = inject(ApiService);
  private readonly auth = inject(AdminAuthService);
  private readonly fb   = inject(FormBuilder);

  get isSchool(): boolean { return this.auth.isSchool(); }
  get isAdmin():  boolean { return this.auth.isAdmin(); }

  readonly levels = LEVELS;
  readonly maxDate = new Date();

  showPwd = false;
  saving  = false;
  error   = '';

  form = this.fb.group({
    firstName: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(2)]),
    lastName: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(2)]),
    email: this.fb.nonNullable.control('', [Validators.required, Validators.email]),
    password: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(6)]),
    level: this.fb.nonNullable.control(LEVELS[0], Validators.required),
    role: this.fb.nonNullable.control('user', Validators.required),
    dateOfBirth: this.fb.control<Date | null>(null),
    phone: this.fb.nonNullable.control(''),
  });

  constructor(
    private readonly dialogRef: MatDialogRef<UserCreateDialogComponent, boolean>,
  ) {}

  ngOnInit(): void {
    if (this.isSchool) {
      this.form.get('password')?.clearValidators();
      this.form.get('level')?.clearValidators();
      this.form.get('role')?.clearValidators();
      this.form.get('password')?.updateValueAndValidity();
      this.form.get('level')?.updateValueAndValidity();
      this.form.get('role')?.updateValueAndValidity();
    }
  }

  async save(): Promise<void> {
    if (this.form.invalid) return;

    this.saving = true;
    this.error  = '';
    try {
      const v = this.form.getRawValue();
      const dateOfBirth = v.dateOfBirth instanceof Date
        ? v.dateOfBirth.toISOString().split('T')[0]
        : null;
      if (this.isSchool) {
        await this.api.post<any>('/school/professors', {
          firstName: v.firstName,
          lastName:  v.lastName,
          email:     v.email,
        });
      } else {
        await this.api.post<AdminUserOut>('/admin/users', {
          firstName:   v.firstName,
          lastName:    v.lastName,
          email:       v.email,
          password:    v.password,
          level:       v.level,
          role:        v.role,
          phone:       v.phone || null,
          dateOfBirth: dateOfBirth,
        });
      }
      this.dialogRef.close(true);
    } catch (e: unknown) {
      this.error = this.extractError(e);
    } finally {
      this.saving = false;
    }
  }

  private extractError(e: unknown): string {
    if (e && typeof e === 'object' && 'error' in e) {
      const detail = (e as { error?: { detail?: string } }).error?.detail;
      if (detail) return detail;
    }
    if (e instanceof Error) return e.message;
    return 'Erreur lors de la création. Vérifiez les données.';
  }
}
