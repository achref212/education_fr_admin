import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ApiService } from '../../core/http/api.service';
import { PhoneInputComponent } from '../../shared/phone-input/phone-input.component';

interface SchoolCreateOut {
  school: { id: string; name: string; email: string; };
  plainPassword: string;
}

@Component({
  selector: 'app-school-create-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatDialogModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule,
    PhoneInputComponent,
  ],
  template: `
    <div class="fd-wrap">
      <!-- header -->
      <div class="fd-header" style="background:linear-gradient(135deg,#10b981,#06b6d4)">
        <div class="fd-header-icon"><mat-icon>add_business</mat-icon></div>
        <div class="fd-header-text">
          <h2 class="fd-title">Nouvel établissement</h2>
          <span class="fd-sub">Créer un compte école sur la plateforme</span>
        </div>
        <button class="fd-close" mat-dialog-close type="button"><mat-icon>close</mat-icon></button>
      </div>

      <!-- body -->
      <div class="fd-body">

        @if (createdResult) {
          <!-- ── Success: show credentials ───────────────────────── -->
          <div class="success-banner">
            <div class="success-ring">
              <mat-icon>check</mat-icon>
            </div>
            <h3>Établissement créé !</h3>
            <p>Un e-mail de bienvenue a été envoyé à <strong>{{ createdResult.school.email }}</strong>.</p>
          </div>
          <div class="cred-card">
            <div class="cred-row">
              <mat-icon class="cred-icon">email</mat-icon>
              <div class="cred-content">
                <span class="cred-label">Adresse e-mail</span>
                <span class="cred-value">{{ createdResult.school.email }}</span>
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

          <!-- ── Create form ─────────────────────────────────────── -->
          <form [formGroup]="form" (ngSubmit)="save()" class="fd-form">

            <mat-form-field appearance="outline" class="fd-full">
              <mat-label>Nom de l'établissement</mat-label>
              <mat-icon matPrefix>business</mat-icon>
              <input matInput formControlName="name" placeholder="École Primaire Victor Hugo" />
            </mat-form-field>

            <mat-form-field appearance="outline" class="fd-full">
              <mat-label>Adresse e-mail</mat-label>
              <mat-icon matPrefix>email</mat-icon>
              <input matInput type="email" formControlName="email"
                     placeholder="contact@ecole-victor-hugo.fr" />
            </mat-form-field>

            <mat-form-field appearance="outline" class="fd-full">
              <mat-label>Adresse</mat-label>
              <mat-icon matPrefix>place</mat-icon>
              <input matInput formControlName="address" placeholder="12 rue de la Paix" />
            </mat-form-field>

            <mat-form-field appearance="outline" class="fd-full">
              <mat-label>Ville</mat-label>
              <mat-icon matPrefix>location_city</mat-icon>
              <input matInput formControlName="city" placeholder="Paris" />
            </mat-form-field>

            <mat-form-field appearance="outline" class="fd-full">
              <mat-label>Code postal</mat-label>
              <mat-icon matPrefix>local_post_office</mat-icon>
              <input matInput formControlName="postalCode" placeholder="75001" />
            </mat-form-field>

            <div class="fd-phone-block">
              <span class="phone-section-label">
                <mat-icon>phone</mat-icon>Téléphone
              </span>
              <app-phone-input formControlName="phone"></app-phone-input>
            </div>

            <mat-form-field appearance="outline" class="fd-full">
              <mat-label>URL du logo</mat-label>
              <mat-icon matPrefix>image</mat-icon>
              <input matInput formControlName="logoUrl" />
            </mat-form-field>

            <mat-form-field appearance="outline" class="fd-full">
              <mat-label>Nom du directeur / de la directrice</mat-label>
              <mat-icon matPrefix>person</mat-icon>
              <input matInput formControlName="directorName" placeholder="Marie Dupont" />
            </mat-form-field>

            @if (error) {
              <div class="fd-error"><mat-icon>error_outline</mat-icon>{{ error }}</div>
            }
          </form>
        }
      </div>

      <!-- footer -->
      <div class="fd-footer">
        @if (createdResult) {
          <button class="fd-btn-save" type="button" (click)="dialogRef.close(true)">
            <mat-icon>done</mat-icon>Fermer
          </button>
        } @else {
          <button class="fd-btn-cancel" mat-dialog-close type="button">Annuler</button>
          <button class="fd-btn-save" type="button" (click)="save()" [disabled]="form.invalid || saving">
            @if (saving) { <mat-spinner diameter="18" class="fd-spinner"></mat-spinner> }
            @else { <mat-icon>add_business</mat-icon> }
            Créer l'établissement
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
    .phone-section-label {
      display: flex; align-items: center; gap: 5px;
      font-size: 12px; font-weight: 700; text-transform: uppercase;
      letter-spacing: .06em; color: var(--clr-text-muted);
      padding-left: 4px;
      mat-icon { font-size: 14px; width: 14px; height: 14px; }
    }

    /* ── Success banner ── */
    .success-banner {
      display: flex; flex-direction: column; align-items: center;
      padding: 28px 0 20px; text-align: center;
    }
    .success-ring {
      width: 64px; height: 64px; border-radius: 50%;
      background: linear-gradient(135deg, #10b981, #06b6d4);
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 8px 24px rgba(16,185,129,.35);
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

    /* ── Credentials card ── */
    .cred-card {
      border: 1px solid rgba(16,185,129,.2);
      border-radius: 16px;
      background: rgba(16,185,129,.05);
      overflow: hidden;
      margin-bottom: 4px;
    }
    .cred-row {
      display: flex; align-items: center; gap: 14px;
      padding: 16px 18px;
    }
    .cred-icon {
      font-size: 20px; width: 20px; height: 20px;
      color: #10b981; flex-shrink: 0;
    }
    .cred-icon--pwd { color: #6366f1; }
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
    .cred-divider { height: 1px; background: rgba(16,185,129,.15); margin: 0; }
    .cred-copy {
      flex-shrink: 0; display: inline-flex; align-items: center; gap: 5px;
      padding: 7px 12px; border-radius: 9px; border: none; cursor: pointer;
      background: rgba(99,102,241,.1); color: #818cf8;
      font-size: 12px; font-weight: 700; font-family: inherit;
      transition: all .2s;
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
export class SchoolCreateDialogComponent {
  private readonly api = inject(ApiService);
  private readonly fb  = inject(FormBuilder);

  saving  = false;
  error   = '';
  copied  = false;
  createdResult: SchoolCreateOut | null = null;

  readonly form = this.fb.nonNullable.group({
    name:         ['', [Validators.required, Validators.minLength(2)]],
    email:        ['', [Validators.required, Validators.email]],
    address:      [''],
    city:         [''],
    postalCode:   [''],
    phone:        [''],
    directorName: [''],
    logoUrl:      [''],
  });

  constructor(readonly dialogRef: MatDialogRef<SchoolCreateDialogComponent, boolean>) {}

  async save(): Promise<void> {
    if (this.form.invalid) return;
    this.saving = true;
    this.error  = '';
    try {
      const v = this.form.getRawValue();
      this.createdResult = await this.api.post<SchoolCreateOut>('/admin/schools', {
        name:         v.name,
        email:        v.email,
        address:      v.address || null,
        city:         v.city || null,
        postalCode:   v.postalCode || null,
        phone:        v.phone || null,
        directorName: v.directorName || null,
        logoUrl:      v.logoUrl || null,
      });
    } catch (e: any) {
      const detail = e?.error?.detail || e?.message || '';
      this.error = detail.toLowerCase().includes('conflict') || detail.includes('déjà utilisé')
        ? 'Cet e-mail est déjà utilisé.'
        : detail || 'Erreur lors de la création.';
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
