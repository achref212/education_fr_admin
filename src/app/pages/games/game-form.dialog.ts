import { Component, Inject, Optional, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { GameOut } from '../../core/models/game.model';
import { ApiService } from '../../core/http/api.service';

export type GameFormData = { game?: GameOut | null };

@Component({
  selector: 'app-game-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="fd-wrap">
      <div class="fd-header" style="background:linear-gradient(135deg,#a855f7,#7c3aed)">
        <div class="fd-header-icon"><mat-icon>sports_esports</mat-icon></div>
        <div class="fd-header-text">
          <h2 class="fd-title">{{ isEdit ? 'Modifier le jeu' : 'Nouveau jeu' }}</h2>
          @if (isEdit) {
            <span class="fd-sub">{{ data.game?.name }}</span>
          }
        </div>
        <button class="fd-close" mat-dialog-close type="button"><mat-icon>close</mat-icon></button>
      </div>
      <div class="fd-body">
        <form [formGroup]="form">
          <mat-form-field appearance="outline" class="fd-full">
            <mat-label>Nom</mat-label>
            <input matInput formControlName="name" />
          </mat-form-field>
          <mat-form-field appearance="outline" class="fd-full">
            <mat-label>Slug</mat-label>
            <input matInput formControlName="slug" placeholder="quiz_duel" />
            @if (isEdit) {
              <mat-hint>Le slug ne peut pas être modifié</mat-hint>
            }
          </mat-form-field>
          <mat-form-field appearance="outline" class="fd-full">
            <mat-label>Description</mat-label>
            <textarea matInput rows="2" formControlName="description"></textarea>
          </mat-form-field>
          <div class="fd-row">
            <mat-form-field appearance="outline" class="fd-field">
              <mat-label>Min joueurs</mat-label>
              <input matInput type="number" formControlName="minPlayers" min="1" />
            </mat-form-field>
            <mat-form-field appearance="outline" class="fd-field">
              <mat-label>Max joueurs</mat-label>
              <input matInput type="number" formControlName="maxPlayers" min="1" />
            </mat-form-field>
            <mat-form-field appearance="outline" class="fd-field">
              <mat-label>Questions</mat-label>
              <input matInput type="number" formControlName="defaultQuestionCount" min="1" />
            </mat-form-field>
          </div>
          @if (error) {
            <div class="fd-error"><mat-icon>error_outline</mat-icon>{{ error }}</div>
          }
        </form>
      </div>
      <div class="fd-footer">
        <button class="fd-btn-cancel" mat-dialog-close type="button">
          <mat-icon>close</mat-icon>
          Annuler
        </button>
        <button class="fd-btn-save" type="button" [disabled]="form.invalid || saving" (click)="save()">
          @if (saving) { <mat-spinner class="fd-spinner" diameter="18" /> } @else { <mat-icon>save</mat-icon> }
          <span>{{ isEdit ? 'Enregistrer' : 'Créer' }}</span>
        </button>
      </div>
    </div>
  `,
  styleUrl: '../../shared/form-dialog.scss',
})
export class GameFormDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ApiService);
  readonly dialogRef = inject(MatDialogRef<GameFormDialogComponent>);
  readonly data: GameFormData;

  saving = false;
  error = '';

  readonly form = this.fb.group({
    name: ['', Validators.required],
    slug: ['', Validators.required],
    description: [''],
    minPlayers: [2, [Validators.required, Validators.min(1)]],
    maxPlayers: [8, [Validators.required, Validators.min(1)]],
    defaultQuestionCount: [10, [Validators.required, Validators.min(1)]],
  });

  constructor(@Optional() @Inject(MAT_DIALOG_DATA) data: GameFormData | null) {
    this.data = data ?? {};
    if (this.data.game) {
      const g = this.data.game;
      this.form.patchValue({
        name: g.name,
        slug: g.slug,
        description: g.description ?? '',
        minPlayers: g.minPlayers,
        maxPlayers: g.maxPlayers,
        defaultQuestionCount: g.defaultQuestionCount,
      });
      this.form.get('slug')?.disable();
    }
  }

  get isEdit(): boolean {
    return !!this.data.game;
  }

  async save(): Promise<void> {
    if (this.form.invalid) return;
    const raw = this.form.getRawValue();
    const minPlayers = Number(raw.minPlayers);
    const maxPlayers = Number(raw.maxPlayers);
    if (minPlayers > maxPlayers) {
      this.error = 'Le minimum de joueurs ne peut pas dépasser le maximum.';
      return;
    }
    this.saving = true;
    this.error = '';
    try {
      const body = {
        name: raw.name,
        description: raw.description || null,
        minPlayers,
        maxPlayers,
        defaultQuestionCount: Number(raw.defaultQuestionCount),
      };
      if (this.data.game) {
        await this.api.put(`/admin/games/${this.data.game.id}`, body);
      } else {
        await this.api.post('/admin/games', {
          ...body,
          slug: raw.slug,
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
    return 'Erreur lors de la sauvegarde.';
  }
}
