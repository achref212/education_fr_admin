import { Component, Inject, Optional, inject, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import { DELF_LEVELS, DELF_TARGETS_BY_CLASS } from '../../core/constants/delf-targets';
import { LEVELS } from '../../core/constants/form-options';
import { LearningPathOut } from '../../core/models/learning-path.model';
import { ApiService } from '../../core/http/api.service';

export type LearningPathFormData = {
  path?: LearningPathOut | null;
  existingClassLevels?: string[];
};

@Component({
  selector: 'app-learning-path-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
  ],
  template: `
    <div class="fd-wrap">
      <div class="fd-header" style="background:linear-gradient(135deg,#6366f1,#06b6d4)">
        <div class="fd-header-icon"><mat-icon>route</mat-icon></div>
        <div class="fd-header-text">
          <h2 class="fd-title">{{ isEdit ? 'Modifier le parcours' : 'Nouveau parcours' }}</h2>
          @if (!isEdit) {
            <span class="fd-sub">Un seul parcours par niveau scolaire</span>
          }
        </div>
        <button class="fd-close" mat-dialog-close type="button"><mat-icon>close</mat-icon></button>
      </div>
      <div class="fd-body">
        @if (!isEdit && availableLevels.length === 0) {
          <div class="fd-info">
            <mat-icon>info</mat-icon>
            <p>Tous les niveaux scolaires ont déjà un parcours DELF. Utilisez <strong>Modifier</strong> sur un parcours existant.</p>
          </div>
        } @else {
          <form [formGroup]="form">
            <mat-form-field appearance="outline" class="fd-full">
              <mat-label>Titre</mat-label>
              <input matInput formControlName="title" placeholder="Parcours DELF — 7ème année" />
            </mat-form-field>
            <mat-form-field appearance="outline" class="fd-full">
              <mat-label>Description</mat-label>
              <textarea matInput rows="3" formControlName="description"></textarea>
            </mat-form-field>
            <div class="fd-row">
              <mat-form-field appearance="outline" class="fd-field">
                <mat-label>Niveau scolaire</mat-label>
                <mat-select formControlName="classLevel">
                  @for (lvl of availableLevels; track lvl) {
                    <mat-option [value]="lvl">{{ lvl }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline" class="fd-field">
                <mat-label>Objectif DELF</mat-label>
                <mat-select formControlName="delfTargetLevel">
                  @for (lvl of delfLevels; track lvl) {
                    <mat-option [value]="lvl">{{ lvl }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            </div>
            @if (!isEdit && selectedClassLevel) {
              <p class="fd-hint">
                Objectif recommandé pour {{ selectedClassLevel }} :
                <strong>{{ recommendedDelf }}</strong>
              </p>
            }
            @if (isEdit) {
              <div class="fd-toggle-row">
                <div class="fd-toggle-info">
                  <mat-icon>toggle_on</mat-icon>
                  <div>
                    <span class="fd-toggle-name">Parcours actif</span>
                    <span class="fd-toggle-desc">Visible pour les élèves de ce niveau</span>
                  </div>
                </div>
                <mat-slide-toggle formControlName="isActive" color="primary"></mat-slide-toggle>
              </div>
            }
            @if (error) {
              <div class="fd-error"><mat-icon>error_outline</mat-icon>{{ error }}</div>
            }
          </form>
        }
      </div>
      <div class="fd-footer">
        <button mat-button mat-dialog-close type="button">Annuler</button>
        @if (isEdit || availableLevels.length > 0) {
          <button class="fd-submit" type="button" [disabled]="form.invalid || saving" (click)="save()">
            @if (saving) { <mat-spinner diameter="18" /> } @else { <mat-icon>save</mat-icon> }
            Enregistrer
          </button>
        }
      </div>
    </div>
  `,
  styles: [`
    @use '../../shared/form-dialog';

    .fd-info {
      display: flex;
      gap: 12px;
      padding: 16px;
      border-radius: 12px;
      background: rgba(99, 102, 241, 0.08);
      border: 1px solid rgba(99, 102, 241, 0.2);
      color: var(--clr-text-muted);
      font-size: 13px;
      line-height: 1.5;

      mat-icon {
        flex-shrink: 0;
        color: #818cf8;
      }

      p { margin: 0; }
      strong { color: var(--clr-text); }
    }

    .fd-hint {
      margin: 0 0 12px;
      font-size: 12px;
      color: var(--clr-text-muted);

      strong { color: var(--clr-primary-light); }
    }
  `],
})
export class LearningPathFormDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ApiService);
  readonly dialogRef = inject(MatDialogRef<LearningPathFormDialogComponent>);

  readonly levels = LEVELS;
  readonly delfLevels = DELF_LEVELS;
  readonly data: LearningPathFormData;
  saving = false;
  error = '';

  readonly form = this.fb.group({
    title: ['', Validators.required],
    description: [''],
    classLevel: ['', Validators.required],
    delfTargetLevel: ['A1', Validators.required],
    isActive: [true],
  });

  constructor(@Optional() @Inject(MAT_DIALOG_DATA) data: LearningPathFormData | null) {
    this.data = data ?? {};
  }

  get isEdit(): boolean {
    return !!this.data.path;
  }

  get availableLevels(): string[] {
    if (this.isEdit && this.data.path) {
      return [this.data.path.classLevel];
    }
    const taken = new Set(this.data.existingClassLevels ?? []);
    return this.levels.filter((level) => !taken.has(level));
  }

  get selectedClassLevel(): string {
    return this.form.getRawValue().classLevel ?? '';
  }

  get recommendedDelf(): string {
    return DELF_TARGETS_BY_CLASS[this.selectedClassLevel] ?? '—';
  }

  ngOnInit(): void {
    if (this.data.path) {
      this.form.patchValue({
        title: this.data.path.title,
        description: this.data.path.description ?? '',
        classLevel: this.data.path.classLevel,
        delfTargetLevel: this.data.path.delfTargetLevel,
        isActive: this.data.path.isActive,
      });
      this.form.get('classLevel')?.disable();
    } else {
      const firstLevel = this.availableLevels[0];
      if (firstLevel) {
        this.form.patchValue({
          classLevel: firstLevel,
          delfTargetLevel: DELF_TARGETS_BY_CLASS[firstLevel] ?? 'A1',
          title: `Parcours DELF — ${firstLevel}`,
        });
      }
    }
    this.form.get('classLevel')?.valueChanges.subscribe((v) => {
      if (v && DELF_TARGETS_BY_CLASS[v]) {
        this.form.patchValue({ delfTargetLevel: DELF_TARGETS_BY_CLASS[v] });
        if (!this.isEdit && !this.form.get('title')?.dirty) {
          this.form.patchValue({ title: `Parcours DELF — ${v}` });
        }
      }
    });
  }

  async save(): Promise<void> {
    if (this.form.invalid) return;
    this.saving = true;
    this.error = '';
    try {
      const raw = this.form.getRawValue();
      if (this.data.path) {
        await this.api.put(`/admin/learning-paths/${this.data.path.id}`, {
          title: raw.title,
          description: raw.description || null,
          delfTargetLevel: raw.delfTargetLevel,
          isActive: raw.isActive,
        });
      } else {
        await this.api.post('/admin/learning-paths', {
          title: raw.title,
          description: raw.description || null,
          classLevel: raw.classLevel,
          delfTargetLevel: raw.delfTargetLevel,
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
    if (e instanceof HttpErrorResponse) {
      const detail = e.error?.detail;
      if (typeof detail === 'string') return detail;
    }
    return 'Erreur lors de la sauvegarde.';
  }
}
