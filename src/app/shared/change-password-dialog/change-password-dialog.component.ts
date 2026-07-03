import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { AdminAuthService } from '../../core/auth/admin-auth.service';

@Component({
  selector: 'app-change-password-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
  ],
  template: `
    <h2 mat-dialog-title>Changer de mot de passe</h2>
    <mat-dialog-content>
      <p style="margin-top:0; margin-bottom: 24px; color: var(--text-muted);">
        C'est votre première connexion (ou votre mot de passe a été réinitialisé).
        Veuillez choisir un nouveau mot de passe sécurisé pour continuer.
      </p>

      @if (error) {
        <div class="alert-error" style="margin-bottom: 16px; padding: 12px; background: #fee2e2; color: #b91c1c; border-radius: 8px;">
          {{ error }}
        </div>
      }

      <form [formGroup]="form" (ngSubmit)="onSubmit()" id="pwd-form">
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Ancien mot de passe</mat-label>
          <input matInput [type]="hideOld ? 'password' : 'text'" formControlName="oldPassword" required>
          <button mat-icon-button matSuffix (click)="hideOld = !hideOld" type="button">
            <mat-icon>{{ hideOld ? 'visibility_off' : 'visibility' }}</mat-icon>
          </button>
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full" style="margin-top: 8px;">
          <mat-label>Nouveau mot de passe</mat-label>
          <input matInput [type]="hideNew ? 'password' : 'text'" formControlName="newPassword" required>
          <button mat-icon-button matSuffix (click)="hideNew = !hideNew" type="button">
            <mat-icon>{{ hideNew ? 'visibility_off' : 'visibility' }}</mat-icon>
          </button>
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full" style="margin-top: 8px;">
          <mat-label>Confirmer le nouveau mot de passe</mat-label>
          <input matInput [type]="hideConfirm ? 'password' : 'text'" formControlName="confirmPassword" required>
          <button mat-icon-button matSuffix (click)="hideConfirm = !hideConfirm" type="button">
            <mat-icon>{{ hideConfirm ? 'visibility_off' : 'visibility' }}</mat-icon>
          </button>
          @if (form.errors?.['mismatch'] && form.get('confirmPassword')?.touched) {
            <mat-error>Les mots de passe ne correspondent pas</mat-error>
          }
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-flat-button color="primary" type="submit" form="pwd-form" [disabled]="form.invalid || loading">
        Enregistrer et continuer
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .w-full { width: 100%; }
  `]
})
export class ChangePasswordDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AdminAuthService);
  private readonly dialogRef = inject(MatDialogRef<ChangePasswordDialogComponent>);

  hideOld = true;
  hideNew = true;
  hideConfirm = true;
  loading = false;
  error = '';

  readonly form = this.fb.nonNullable.group({
    oldPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required],
  }, { validators: this.passwordMatchValidator });

  private passwordMatchValidator(g: any) {
    return g.get('newPassword').value === g.get('confirmPassword').value
      ? null : { mismatch: true };
  }

  async onSubmit() {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';
    try {
      await this.auth.changePassword(
        this.form.getRawValue().oldPassword,
        this.form.getRawValue().newPassword
      );
      this.dialogRef.close(true);
    } catch (e: any) {
      this.error = e.message || 'Erreur lors du changement de mot de passe';
    } finally {
      this.loading = false;
    }
  }
}
