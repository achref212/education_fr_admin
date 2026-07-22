import { Component, Inject, inject } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AdminUserOut } from '../../core/models/user.model';
import { ApiService } from '../../core/http/api.service';
import { LEVELS } from '../../core/constants/form-options';

export interface UserEditData { user: AdminUserOut; }

@Component({
  selector: 'app-user-edit-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatRadioModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="fd-wrap">
      <!-- header -->
      <div class="fd-header" style="background:linear-gradient(135deg,#6366f1,#8b5cf6)">
        <div class="fd-header-icon">
          <mat-icon>manage_accounts</mat-icon>
        </div>
        <div class="fd-header-text">
          <h2 class="fd-title">Modifier l'utilisateur</h2>
          <span class="fd-sub">{{ data.user.email }}</span>
        </div>
        <button class="fd-close" mat-dialog-close type="button">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- body -->
      <div class="fd-body">
        <form [formGroup]="form" (ngSubmit)="save()">

          <!-- level -->
          <mat-form-field appearance="outline" class="fd-full">
            <mat-label>URL photo profil</mat-label>
            <mat-icon matPrefix>image</mat-icon>
            <input matInput formControlName="profilePictureUrl" />
          </mat-form-field>

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
                  <span class="fd-radio-desc">Accès élève</span>
                </div>
              </label>
              <label class="fd-radio-card" [class.selected]="form.get('role')?.value === 'admin'">
                <mat-radio-button value="admin" color="primary"></mat-radio-button>
                <div class="fd-radio-info">
                  <mat-icon class="fd-radio-icon" style="color:#a855f7">shield</mat-icon>
                  <span class="fd-radio-name">Administrateur</span>
                  <span class="fd-radio-desc">Accès complet</span>
                </div>
              </label>
              <label class="fd-radio-card" [class.selected]="form.get('role')?.value === 'prof'">
                <mat-radio-button value="prof" color="primary"></mat-radio-button>
                <div class="fd-radio-info">
                  <mat-icon class="fd-radio-icon" style="color:#10b981">school</mat-icon>
                  <span class="fd-radio-name">Professeur</span>
                  <span class="fd-radio-desc">Gestion des classes et contenus</span>
                </div>
              </label>
            </mat-radio-group>
          </div>

          <!-- active toggle -->
          <div class="fd-toggle-row">
            <div class="fd-toggle-info">
              <mat-icon>toggle_on</mat-icon>
              <div>
                <span class="fd-toggle-name">Compte actif</span>
                <span class="fd-toggle-desc">L'utilisateur peut se connecter</span>
              </div>
            </div>
            <mat-slide-toggle formControlName="isActive" color="primary"></mat-slide-toggle>
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
            <mat-icon>save</mat-icon>
          }
          Enregistrer
        </button>
      </div>
    </div>
  `,
  styles: [`@use '../../shared/form-dialog';`],
})
export class UserEditDialogComponent {
  private readonly api = inject(ApiService);
  private readonly fb  = inject(FormBuilder);

  readonly levels = LEVELS;
  saving  = false;
  error   = '';

  form = this.fb.nonNullable.group({
    role:     ['', Validators.required],
    level:    ['', Validators.required],
    isActive: [true],
    profilePictureUrl: [''],
  });

  constructor(
    private readonly dialogRef: MatDialogRef<UserEditDialogComponent, boolean>,
    @Inject(MAT_DIALOG_DATA) public data: UserEditData,
  ) {
    this.form.patchValue({
      role:     data.user.role,
      level:    data.user.level,
      isActive: data.user.isActive,
      profilePictureUrl: data.user.profilePictureUrl ?? '',
    });
  }

  async save(): Promise<void> {
    if (this.form.invalid) return;
    this.saving = true;
    this.error  = '';
    try {
      const v = this.form.getRawValue();
      await this.api.put<AdminUserOut>(`/admin/users/${this.data.user.id}`, {
        role:     v.role,
        level:    v.level,
        isActive: v.isActive,
        profilePictureUrl: v.profilePictureUrl || null,
      });
      this.dialogRef.close(true);
    } catch {
      this.error = 'Erreur lors de la mise à jour.';
    } finally {
      this.saving = false;
    }
  }
}
