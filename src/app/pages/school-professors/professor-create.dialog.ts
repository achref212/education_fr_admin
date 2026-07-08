import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ProfCreateOut } from '../../core/models/user.model';
import { ApiService } from '../../core/http/api.service';
import { PhoneInputComponent } from '../../shared/phone-input/phone-input.component';

@Component({
  selector: 'app-professor-create-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatDialogModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule,
    MatDatepickerModule, MatNativeDateModule,
    PhoneInputComponent,
  ],
  template: `
    <div class="fd-wrap">
      <div class="fd-header" style="background:linear-gradient(135deg,#6366f1,#a855f7)">
        <div class="fd-header-icon"><mat-icon>person_add</mat-icon></div>
        <div class="fd-header-text">
          <h2 class="fd-title">Nouveau professeur</h2>
          <span class="fd-sub">Créer un compte professeur pour votre établissement</span>
        </div>
        <button class="fd-close" mat-dialog-close type="button"><mat-icon>close</mat-icon></button>
      </div>

      <div class="fd-body">
        @if (createdResult) {
          <div class="success-banner">
            <div class="success-ring">
              <mat-icon>check</mat-icon>
            </div>
            <h3>Professeur créé !</h3>
            <p>Un e-mail de bienvenue a été envoyé à <strong>{{ createdResult.email }}</strong>.</p>
          </div>
          <div class="cred-card">
            <div class="cred-row">
              <mat-icon class="cred-icon">person</mat-icon>
              <div class="cred-content">
                <span class="cred-label">Professeur</span>
                <span class="cred-value">{{ createdResult.firstName }} {{ createdResult.lastName }}</span>
              </div>
            </div>
            <div class="cred-divider"></div>
            <div class="cred-row">
              <mat-icon class="cred-icon">email</mat-icon>
              <div class="cred-content">
                <span class="cred-label">Adresse e-mail</span>
                <span class="cred-value">{{ createdResult.email }}</span>
              </div>
            </div>
            <div class="cred-divider"></div>
            <div class="cred-row">
              <mat-icon class="cred-icon cred-icon--pwd">lock</mat-icon>
              <div class="cred-content">
                <span class="cred-label">Mot de passe initial</span>
                <span class="cred-value cred-mono">{{ createdResult.plainPassword }}</span>
              </div>
              <button class="cred-copy" type="button" (click)="copyPwd()" [title]="copied ? 'Copié !' : 'Copier'">
                <mat-icon>{{ copied ? 'check' : 'content_copy' }}</mat-icon>
                <span>{{ copied ? 'Copié' : 'Copier' }}</span>
              </button>
            </div>
            <div class="cred-warning">
              <mat-icon>warning_amber</mat-icon>
              Ce mot de passe ne sera affiché qu'une seule fois. Notez-le maintenant.
            </div>
          </div>
        } @else {
          <form [formGroup]="form" class="fd-form">
            <div class="fd-row">
              <mat-form-field appearance="outline" class="fd-field">
                <mat-label>Prénom</mat-label>
                <mat-icon matPrefix>badge</mat-icon>
                <input matInput formControlName="firstName" placeholder="Marie" />
              </mat-form-field>
              <mat-form-field appearance="outline" class="fd-field">
                <mat-label>Nom</mat-label>
                <input matInput formControlName="lastName" placeholder="Dupont" />
              </mat-form-field>
            </div>

            <mat-form-field appearance="outline" class="fd-full">
              <mat-label>Adresse e-mail</mat-label>
              <mat-icon matPrefix>email</mat-icon>
              <input matInput type="email" formControlName="email" placeholder="marie.dupont@ecole.fr" />
            </mat-form-field>

            <mat-form-field appearance="outline" class="fd-full dob-field">
              <mat-label>Date de naissance</mat-label>
              <mat-icon matPrefix>cake</mat-icon>
              <input
                matInput
                [matDatepicker]="birthPicker"
                formControlName="dateOfBirth"
                [matDatepickerFilter]="isBirthDateAllowed"
                placeholder="Sélectionner une date"
                readonly
                (click)="birthPicker.open()"
                (focus)="birthPicker.open()"
              />
              <mat-datepicker-toggle matIconSuffix [for]="birthPicker"></mat-datepicker-toggle>
              <mat-datepicker #birthPicker panelClass="birthday-panel"></mat-datepicker>
            </mat-form-field>

            <div class="fd-phone-block">
              <span class="phone-section-label">
                <mat-icon>phone</mat-icon>Téléphone
              </span>
              <app-phone-input formControlName="phone"></app-phone-input>
            </div>

            <div class="info-alert">
              <mat-icon>info</mat-icon>
              Un mot de passe sera généré automatiquement et envoyé par e-mail au professeur.
            </div>

            @if (error) {
              <div class="fd-error"><mat-icon>error_outline</mat-icon>{{ error }}</div>
            }
          </form>
        }
      </div>

      <div class="fd-footer">
        @if (createdResult) {
          <button class="fd-btn-save" type="button" (click)="dialogRef.close(true)">
            <mat-icon>done</mat-icon>Fermer
          </button>
        } @else {
          <button class="fd-btn-cancel" mat-dialog-close type="button">Annuler</button>
          <button class="fd-btn-save" type="button" (click)="save()" [disabled]="form.invalid || saving">
            @if (saving) { <mat-spinner diameter="18" class="fd-spinner"></mat-spinner> }
            @else { <mat-icon>person_add</mat-icon> }
            Créer le professeur
          </button>
        }
      </div>
    </div>
  `,
  styles: [`
    @use '../../shared/form-dialog';

    .fd-phone-block {
      display: flex;
      flex-direction: column;
      gap: 6px;
      width: 100%;
    }
    .dob-field {
      cursor: pointer;
      input { cursor: pointer; }
    }
    .phone-section-label {
      display: flex; align-items: center; gap: 5px;
      font-size: 12px; font-weight: 700; text-transform: uppercase;
      letter-spacing: .06em; color: var(--clr-text-muted);
      padding-left: 4px;
      mat-icon { font-size: 14px; width: 14px; height: 14px; }
    }
    .info-alert {
      display: flex; align-items: center; gap: 8px;
      padding: 12px 16px; border-radius: 12px;
      background: rgba(99,102,241,.07); border: 1px solid rgba(99,102,241,.18);
      color: var(--clr-text-muted); font-size: 13px;
      mat-icon { font-size: 18px; width: 18px; height: 18px; color: #818cf8; flex-shrink: 0; }
    }
    .success-banner {
      display: flex; flex-direction: column; align-items: center;
      padding: 28px 0 20px; text-align: center;
    }
    .success-ring {
      width: 64px; height: 64px; border-radius: 50%;
      background: linear-gradient(135deg, #6366f1, #a855f7);
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 8px 24px rgba(99,102,241,.35);
      mat-icon { font-size: 32px; width: 32px; height: 32px; color: white; }
    }
    .success-banner h3 {
      margin: 14px 0 6px; font-size: 18px; font-weight: 800;
      color: var(--clr-text);
    }
    .success-banner p {
      margin: 0; font-size: 13px; color: var(--clr-text-muted);
      strong { color: var(--clr-text); }
    }
    .cred-card {
      border: 1px solid rgba(99,102,241,.2);
      border-radius: 16px;
      background: rgba(99,102,241,.05);
      overflow: hidden;
    }
    .cred-row {
      display: flex; align-items: center; gap: 14px;
      padding: 16px 18px;
    }
    .cred-icon {
      font-size: 20px; width: 20px; height: 20px;
      color: #6366f1; flex-shrink: 0;
    }
    .cred-icon--pwd { color: #a855f7; }
    .cred-content { flex: 1; min-width: 0; }
    .cred-label {
      display: block; font-size: 11px; font-weight: 700;
      text-transform: uppercase; letter-spacing: .07em;
      color: var(--clr-text-muted); margin-bottom: 3px;
    }
    .cred-value {
      display: block; font-size: 14px; font-weight: 600;
      color: var(--clr-text); word-break: break-all;
    }
    .cred-mono { font-family: 'Courier New', monospace; font-size: 15px; }
    .cred-divider { height: 1px; background: rgba(99,102,241,.15); }
    .cred-copy {
      flex-shrink: 0; display: inline-flex; align-items: center; gap: 5px;
      padding: 7px 12px; border-radius: 9px; border: none; cursor: pointer;
      background: rgba(99,102,241,.1); color: #818cf8;
      font-size: 12px; font-weight: 700; font-family: inherit;
      mat-icon { font-size: 15px; width: 15px; height: 15px; }
      &:hover { background: rgba(99,102,241,.2); color: #a5b4fc; }
    }
    .cred-warning {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 18px; font-size: 12px; color: #f59e0b;
      background: rgba(245,158,11,.07);
      border-top: 1px solid rgba(245,158,11,.15);
      mat-icon { font-size: 16px; width: 16px; height: 16px; flex-shrink: 0; }
    }
  `],
})
export class ProfessorCreateDialogComponent {
  private readonly api = inject(ApiService);
  private readonly fb  = inject(FormBuilder);

  saving  = false;
  error   = '';
  copied  = false;
  createdResult: ProfCreateOut | null = null;

  readonly maxDate = new Date();

  readonly form = this.fb.group({
    firstName: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(2)]),
    lastName: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(2)]),
    email: this.fb.nonNullable.control('', [Validators.required, Validators.email]),
    phone: this.fb.nonNullable.control(''),
    dateOfBirth: this.fb.control<Date | null>(null),
  });

  isBirthDateAllowed = (date: Date | null): boolean => {
    if (!date) return false;
    return date.getTime() <= this.maxDate.getTime();
  };

  constructor(readonly dialogRef: MatDialogRef<ProfessorCreateDialogComponent, boolean>) {}

  async save(): Promise<void> {
    if (this.form.invalid) return;
    this.saving = true;
    this.error  = '';
    try {
      const v = this.form.getRawValue();
      const dob = v.dateOfBirth instanceof Date
        ? v.dateOfBirth.toISOString().split('T')[0]
        : null;
      this.createdResult = await this.api.post<ProfCreateOut>('/school/professors', {
        firstName:   v.firstName,
        lastName:    v.lastName,
        email:       v.email,
        phone:       v.phone || null,
        dateOfBirth: dob,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '';
      this.error = msg.includes('déjà utilisé') || msg.includes('409')
        ? 'Cet e-mail est déjà utilisé.'
        : msg || 'Erreur lors de la création.';
    } finally {
      this.saving = false;
    }
  }

  async copyPwd(): Promise<void> {
    if (!this.createdResult) return;
    await navigator.clipboard.writeText(this.createdResult.plainPassword);
    this.copied = true;
    setTimeout(() => (this.copied = false), 2500);
  }
}
