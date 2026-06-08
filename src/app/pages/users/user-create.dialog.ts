import { Component, inject } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AdminUserOut } from '../../core/models/user.model';
import { ApiService } from '../../core/http/api.service';
import { LEVELS } from '../../core/constants/form-options';

@Component({
  selector: 'app-user-create-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatRadioModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="fd-wrap">
      <!-- header -->
      <div class="fd-header" style="background:linear-gradient(135deg,#ec4899,#f97316)">
        <div class="fd-header-icon">
          <mat-icon>person_add</mat-icon>
        </div>
        <div class="fd-header-text">
          <h2 class="fd-title">Nouvel utilisateur</h2>
          <span class="fd-sub">Créer un compte sur la plateforme</span>
        </div>
        <button class="fd-close" mat-dialog-close type="button">
          <mat-icon>close</mat-icon>
        </button>
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

          <!-- password -->
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

          <!-- level -->
          <mat-form-field appearance="outline" class="fd-full">
            <mat-label>Niveau scolaire</mat-label>
            <mat-icon matPrefix>school</mat-icon>
            <mat-select formControlName="level">
              @for (lvl of levels; track lvl) {
                <mat-option [value]="lvl">{{ lvl }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <!-- role radio -->
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

          @if (error) {
            <div class="fd-error">
              <mat-icon>error_outline</mat-icon>{{ error }}
            </div>
          }
        </form>
      </div>

      <!-- footer -->
      <div class="fd-footer">
        <button class="fd-btn-cancel" mat-dialog-close type="button">Annuler</button>
        <button class="fd-btn-save" type="button" (click)="save()"
                [disabled]="form.invalid || saving">
          @if (saving) {
            <mat-spinner diameter="18" class="fd-spinner"></mat-spinner>
          } @else {
            <mat-icon>person_add</mat-icon>
          }
          Créer l'utilisateur
        </button>
      </div>
    </div>
  `,
  styles: [`@use '../../shared/form-dialog';`],
})
export class UserCreateDialogComponent {
  private readonly api = inject(ApiService);
  private readonly fb  = inject(FormBuilder);

  readonly levels = LEVELS;
  showPwd = false;
  saving  = false;
  error   = '';

  form = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName:  ['', [Validators.required, Validators.minLength(2)]],
    email:     ['', [Validators.required, Validators.email]],
    password:  ['', [Validators.required, Validators.minLength(6)]],
    level:     [LEVELS[1], Validators.required],
    role:      ['user', Validators.required],
  });

  constructor(
    private readonly dialogRef: MatDialogRef<UserCreateDialogComponent, boolean>,
  ) {}

  async save(): Promise<void> {
    if (this.form.invalid) return;
    this.saving = true;
    this.error  = '';
    try {
      const v = this.form.getRawValue();
      await this.api.post<AdminUserOut>('/admin/users', {
        firstName: v.firstName,
        lastName:  v.lastName,
        email:     v.email,
        password:  v.password,
        level:     v.level,
        role:      v.role,
      });
      this.dialogRef.close(true);
    } catch {
      this.error = 'Erreur lors de la création. Vérifiez les données.';
    } finally {
      this.saving = false;
    }
  }
}
