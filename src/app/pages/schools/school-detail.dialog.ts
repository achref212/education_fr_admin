import { Component, inject, Inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { SchoolOut } from '../../core/models/user.model';
import { ApiService } from '../../core/http/api.service';
import { PhoneInputComponent } from '../../shared/phone-input/phone-input.component';

interface DialogData { school: SchoolOut; }

@Component({
  selector: 'app-school-detail-dialog',
  standalone: true,
  imports: [
    CommonModule, DatePipe, ReactiveFormsModule,
    MatDialogModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatSlideToggleModule,
    MatProgressSpinnerModule, PhoneInputComponent,
  ],
  template: `
    <div class="fd-wrap">
      <!-- header -->
      <div class="fd-header" style="background:linear-gradient(135deg,#10b981,#06b6d4)">
        <div class="fd-header-icon"><mat-icon>domain</mat-icon></div>
        <div class="fd-header-text">
          <h2 class="fd-title">{{ data.school.name }}</h2>
          <span class="fd-sub">Modifier les informations de l'établissement</span>
        </div>
        <button class="fd-close" mat-dialog-close type="button"><mat-icon>close</mat-icon></button>
      </div>

      <!-- meta info strip -->
      <div class="meta-strip">
        <div class="meta-chip">
          <mat-icon>calendar_today</mat-icon>
          <span>Créé le {{ data.school.createdAt | date:'dd/MM/yyyy' }}</span>
        </div>
        <div class="meta-chip">
          <mat-icon>badge</mat-icon>
          <span class="mono">{{ data.school.id | slice:0:12 }}…</span>
        </div>
        <div class="meta-chip" [class.chip-active]="data.school.isActive" [class.chip-inactive]="!data.school.isActive">
          <mat-icon>{{ data.school.isActive ? 'check_circle' : 'cancel' }}</mat-icon>
          <span>{{ data.school.isActive ? 'Actif' : 'Inactif' }}</span>
        </div>
      </div>

      <!-- body -->
      <div class="fd-body">
        <form [formGroup]="form" (ngSubmit)="save()">

          <div class="fd-row">
            <mat-form-field appearance="outline" class="fd-field">
              <mat-label>Nom de l'établissement</mat-label>
              <mat-icon matPrefix>business</mat-icon>
              <input matInput formControlName="name" />
            </mat-form-field>
            <mat-form-field appearance="outline" class="fd-field">
              <mat-label>Adresse e-mail</mat-label>
              <mat-icon matPrefix>email</mat-icon>
              <input matInput type="email" formControlName="email" />
            </mat-form-field>
          </div>

          <div class="fd-row">
            <mat-form-field appearance="outline" class="fd-field">
              <mat-label>Adresse</mat-label>
              <mat-icon matPrefix>place</mat-icon>
              <input matInput formControlName="address" placeholder="12 rue de la Paix" />
            </mat-form-field>
            <mat-form-field appearance="outline" class="fd-field">
              <mat-label>Ville</mat-label>
              <input matInput formControlName="city" placeholder="Paris" />
            </mat-form-field>
          </div>

          <div class="fd-row">
            <mat-form-field appearance="outline" class="fd-field">
              <mat-label>Code postal</mat-label>
              <mat-icon matPrefix>local_post_office</mat-icon>
              <input matInput formControlName="postalCode" placeholder="75001" />
            </mat-form-field>
            <!-- ── Phone ── -->
            <div class="fd-field phone-label-wrap">
              <span class="phone-section-label">
                <mat-icon>phone</mat-icon>Téléphone
              </span>
              <app-phone-input formControlName="phone"></app-phone-input>
            </div>
          </div>

          <mat-form-field appearance="outline" class="fd-full">
            <mat-label>URL du logo</mat-label>
            <mat-icon matPrefix>image</mat-icon>
            <input matInput formControlName="logoUrl" />
          </mat-form-field>

          <mat-form-field appearance="outline" class="fd-full">
            <mat-label>Nom du directeur / de la directrice</mat-label>
            <mat-icon matPrefix>person</mat-icon>
            <input matInput formControlName="directorName" />
          </mat-form-field>

          <!-- active toggle -->
          <div class="fd-toggle-row">
            <div class="fd-toggle-info">
              <mat-icon>toggle_on</mat-icon>
              <div>
                <span class="fd-toggle-name">Compte actif</span>
                <span class="fd-toggle-desc">Permet à l'établissement de se connecter</span>
              </div>
            </div>
            <mat-slide-toggle formControlName="isActive" color="primary"></mat-slide-toggle>
          </div>

          @if (error) {
            <div class="fd-error"><mat-icon>error_outline</mat-icon>{{ error }}</div>
          }
          @if (success) {
            <div class="fd-success">
              <mat-icon>check_circle_outline</mat-icon>
              Modifications enregistrées avec succès
            </div>
          }
        </form>
      </div>

      <!-- footer -->
      <div class="fd-footer">
        <button class="fd-btn-cancel" type="button" [mat-dialog-close]="saved">Fermer</button>
        <button class="fd-btn-save" type="button" (click)="save()" [disabled]="form.invalid || saving">
          @if (saving) { <mat-spinner diameter="18" class="fd-spinner"></mat-spinner> }
          @else { <mat-icon>save</mat-icon> }
          Enregistrer
        </button>
      </div>
    </div>
  `,
  styles: [`
    @use '../../shared/form-dialog';

    /* Phone label */
    .phone-label-wrap { display: flex; flex-direction: column; gap: 4px; }
    .phone-section-label {
      display: flex; align-items: center; gap: 5px;
      font-size: 12px; font-weight: 700; text-transform: uppercase;
      letter-spacing: .06em; color: var(--clr-text-muted); margin-bottom: 2px;
      mat-icon { font-size: 14px; width: 14px; height: 14px; }
    }

    /* Meta strip */
    .meta-strip {
      display: flex; flex-wrap: wrap; gap: 8px;
      padding: 12px 24px; background: rgba(16,185,129,.04);
      border-bottom: 1px solid rgba(16,185,129,.1);
    }
    .meta-chip {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 4px 12px; border-radius: 99px; font-size: 12px;
      background: rgba(255,255,255,.04);
      border: 1px solid rgba(255,255,255,.07);
      color: var(--clr-text-muted);
      mat-icon { font-size: 14px; width: 14px; height: 14px; }
    }
    .chip-active  { color: #10b981; border-color: rgba(16,185,129,.3); background: rgba(16,185,129,.08); mat-icon { color: #10b981; } }
    .chip-inactive{ color: #ef4444; border-color: rgba(239,68,68,.3);  background: rgba(239,68,68,.08);  mat-icon { color: #ef4444; } }
    .mono { font-family: 'Courier New', monospace; }

    .fd-success {
      display: flex; align-items: center; gap: 8px;
      background: rgba(16,185,129,.08); border: 1px solid rgba(16,185,129,.2);
      border-radius: 10px; padding: 10px 14px; color: #10b981;
      font-size: 13px; margin-top: 8px;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
    }
  `],
})
export class SchoolDetailDialogComponent {
  private readonly api = inject(ApiService);
  private readonly fb  = inject(FormBuilder);

  saving  = false;
  error   = '';
  success = false;
  saved   = false;

  readonly form;

  constructor(
    readonly dialogRef: MatDialogRef<SchoolDetailDialogComponent, boolean>,
    @Inject(MAT_DIALOG_DATA) readonly data: DialogData,
  ) {
    this.form = this.fb.nonNullable.group({
      name:         [data.school.name,            [Validators.required, Validators.minLength(2)]],
      email:        [data.school.email,           [Validators.required, Validators.email]],
      address:      [data.school.address ?? ''],
      city:         [data.school.city ?? ''],
      postalCode:   [data.school.postalCode ?? ''],
      phone:        [data.school.phone ?? ''],
      directorName: [data.school.directorName ?? ''],
      logoUrl:      [data.school.logoUrl ?? ''],
      isActive:     [data.school.isActive],
    });
  }

  async save(): Promise<void> {
    if (this.form.invalid) return;
    this.saving  = true;
    this.error   = '';
    this.success = false;
    try {
      const v = this.form.getRawValue();
      await this.api.put(`/admin/schools/${this.data.school.id}`, {
        name:         v.name,
        email:        v.email,
        address:      v.address || null,
        city:         v.city || null,
        postalCode:   v.postalCode || null,
        phone:        v.phone || null,
        directorName: v.directorName || null,
        logoUrl:      v.logoUrl || null,
        isActive:     v.isActive,
      });
      this.success = true;
      this.saved   = true;
      setTimeout(() => (this.success = false), 3000);
    } catch (e: any) {
      this.error = e?.error?.detail || e?.message || 'Erreur lors de la modification.';
    } finally {
      this.saving = false;
    }
  }
}
