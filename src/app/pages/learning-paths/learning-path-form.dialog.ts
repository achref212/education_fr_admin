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

import {
  DELF_TARGETS_BY_CLASS,
  delfGroupsForClass,
  resolveDelfGroupLabel,
  resolveDelfTrack,
} from '../../core/constants/delf-targets';
import { LEVELS } from '../../core/constants/form-options';
import { LearningPathOut } from '../../core/models/learning-path.model';
import { ApiService } from '../../core/http/api.service';

export type LearningPathFormData = {
  path?: LearningPathOut | null;
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
          <span class="fd-sub">Configurez le ciblage DELF et les règles d'affectation</span>
        </div>
        <button class="fd-close" mat-dialog-close type="button"><mat-icon>close</mat-icon></button>
      </div>
      <div class="fd-body">
        <form [formGroup]="form" class="path-form">
          <div class="path-preview">
            <div class="preview-icon"><mat-icon>route</mat-icon></div>
            <div class="preview-main">
              <span class="preview-label">Aperçu</span>
              <strong>{{ form.getRawValue().title || 'Nouveau parcours DELF' }}</strong>
              <p>{{ selectedClassLevel || 'Niveau à choisir' }} · DELF {{ form.getRawValue().delfTargetLevel || '—' }} · {{ scorePreview }}</p>
              <span class="preview-track">{{ selectedDelfTrack }} · niveaux disponibles {{ availableDelfLevels }}</span>
            </div>
            <span class="preview-badge" [class.preview-badge--default]="form.getRawValue().isDefault">
              {{ form.getRawValue().isDefault ? 'Défaut' : 'Ciblé' }}
            </span>
          </div>

          <div class="fd-section"><mat-icon>edit_note</mat-icon> Identité</div>
            <mat-form-field appearance="outline" class="fd-full">
              <mat-label>Titre</mat-label>
              <input matInput formControlName="title" placeholder="Parcours DELF — 7ème année" />
            </mat-form-field>
            <mat-form-field appearance="outline" class="fd-full">
              <mat-label>Description</mat-label>
              <textarea matInput rows="3" formControlName="description" placeholder="Objectif, profil d'élève, contenus principaux…"></textarea>
            </mat-form-field>

            <div class="fd-section"><mat-icon>school</mat-icon> Ciblage</div>
            <div class="fd-row">
              <mat-form-field appearance="outline" class="fd-field">
                <mat-label>Niveau scolaire</mat-label>
                <mat-select formControlName="classLevel">
                  @for (lvl of levels; track lvl) {
                    <mat-option [value]="lvl">{{ lvl }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline" class="fd-field">
                <mat-label>Objectif DELF</mat-label>
                <mat-select formControlName="delfTargetLevel">
                  <mat-select-trigger>
                    <span class="delf-trigger">
                      <span class="delf-trigger__level">{{ form.getRawValue().delfTargetLevel || '—' }}</span>
                      <span class="delf-trigger__track">{{ selectedDelfTrack }}</span>
                    </span>
                  </mat-select-trigger>
                  @for (group of availableDelfGroups; track group.track) {
                    <mat-optgroup [label]="group.label">
                      @for (lvl of group.levels; track lvl) {
                        <mat-option [value]="lvl">
                          <span class="delf-option">
                            <strong>{{ lvl }}</strong>
                            @if (lvl === recommendedDelf) {
                              <span>Recommandé</span>
                            }
                          </span>
                        </mat-option>
                      }
                    </mat-optgroup>
                  }
                </mat-select>
              </mat-form-field>
            </div>
            @if (!isEdit && selectedClassLevel) {
              <div class="recommendation-strip">
                <mat-icon>tips_and_updates</mat-icon>
                <span>{{ selectedDelfGroupLabel }} · objectif recommandé pour {{ selectedClassLevel }} : <strong>{{ recommendedDelf }}</strong></span>
              </div>
            }

            <div class="fd-section"><mat-icon>tune</mat-icon> Affectation automatique</div>
            <div class="score-card">
              <div class="score-card-head">
                <div>
                  <strong>Tranche de score DELF</strong>
                  <span>Utilisée après le test pour affecter le bon parcours.</span>
                </div>
                <span class="score-pill">{{ scorePreview }}</span>
              </div>
              <div class="fd-row">
                <mat-form-field appearance="outline" class="fd-field">
                  <mat-label>Score min</mat-label>
                  <input matInput type="number" min="0" max="100" formControlName="minScore" placeholder="0" />
                </mat-form-field>
                <mat-form-field appearance="outline" class="fd-field">
                  <mat-label>Score max</mat-label>
                  <input matInput type="number" min="0" max="100" formControlName="maxScore" placeholder="100" />
                </mat-form-field>
              </div>
            </div>
            <div class="fd-toggle-row">
              <div class="fd-toggle-info">
                <mat-icon>flag</mat-icon>
                <div>
                  <span class="fd-toggle-name">Parcours par défaut</span>
                  <span class="fd-toggle-desc">Fallback si aucun résultat DELF ne correspond à une tranche</span>
                </div>
              </div>
              <mat-slide-toggle formControlName="isDefault" color="primary"></mat-slide-toggle>
            </div>
            @if (isEdit) {
              <div class="fd-toggle-row">
                <div class="fd-toggle-info">
                  <mat-icon>toggle_on</mat-icon>
                  <div>
                    <span class="fd-toggle-name">Parcours actif</span>
                    <span class="fd-toggle-desc">Visible pour les affectations élèves</span>
                  </div>
                </div>
                <mat-slide-toggle formControlName="isActive" color="primary"></mat-slide-toggle>
              </div>
            }
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
          <span>{{ submitLabel }}</span>
        </button>
      </div>
    </div>
  `,
  styles: [`
    @use '../../shared/form-dialog';

    .fd-wrap { width: 620px; }

    .path-form {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .path-preview {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px;
      border: 1px solid color-mix(in srgb, var(--clr-primary) 24%, var(--clr-border));
      border-radius: 16px;
      background:
        linear-gradient(135deg, color-mix(in srgb, var(--clr-primary) 10%, transparent), transparent 62%),
        var(--clr-surface-2);
      margin-bottom: 2px;
    }

    .preview-icon {
      width: 42px;
      height: 42px;
      border-radius: 13px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg,#6366f1,#06b6d4);
      color: white;
      flex-shrink: 0;
    }

    .preview-main {
      flex: 1;
      min-width: 0;

      strong {
        display: block;
        color: var(--clr-text);
        font-size: 15px;
        line-height: 1.25;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      p {
        margin: 3px 0 0;
        color: var(--clr-text-muted);
        font-size: 12px;
      }
    }

    .preview-track {
      display: block;
      margin-top: 3px;
      color: var(--clr-text-muted);
      font-size: 11px;
      line-height: 1.35;
    }

    .preview-label {
      display: block;
      margin-bottom: 2px;
      color: var(--clr-primary-light);
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: .06em;
    }

    .preview-badge,
    .score-pill {
      padding: 5px 10px;
      border-radius: 99px;
      border: 1px solid var(--clr-border);
      background: var(--clr-surface);
      color: var(--clr-text-muted);
      font-size: 11px;
      font-weight: 800;
      white-space: nowrap;
    }

    .preview-badge--default,
    .score-pill {
      border-color: rgba(16,185,129,.26);
      background: rgba(16,185,129,.12);
      color: #6ee7b7;
    }

    .recommendation-strip {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 12px;
      border-radius: 12px;
      background: rgba(14,165,233,.09);
      border: 1px solid rgba(14,165,233,.22);
      color: var(--clr-text-muted);
      font-size: 12px;
      margin-top: -4px;

      mat-icon { color: #38bdf8; font-size: 17px; width: 17px; height: 17px; }
      strong { color: var(--clr-text); }
    }

    .delf-trigger,
    .delf-option {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
    }

    .delf-trigger__level,
    .delf-option strong {
      color: var(--clr-text);
      font-weight: 800;
    }

    .delf-trigger__track,
    .delf-option span {
      padding: 2px 7px;
      border-radius: 999px;
      background: rgba(14,165,233,.12);
      color: #38bdf8;
      font-size: 10px;
      font-weight: 800;
      line-height: 1.4;
      white-space: nowrap;
    }

    .score-card {
      padding: 14px 14px 2px;
      border-radius: 16px;
      border: 1px solid var(--clr-border);
      background: var(--clr-surface-2);
    }

    .score-card-head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 12px;

      strong {
        display: block;
        color: var(--clr-text);
        font-size: 13px;
      }

      span {
        display: block;
        margin-top: 2px;
        color: var(--clr-text-muted);
        font-size: 11px;
        line-height: 1.35;
      }
    }

    @media (max-width: 640px) {
      .fd-wrap { width: 96vw; }
      .path-preview { align-items: flex-start; }
      .preview-badge { display: none; }
      .score-card-head { flex-direction: column; }
    }
  `],
})
export class LearningPathFormDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ApiService);
  readonly dialogRef = inject(MatDialogRef<LearningPathFormDialogComponent>);

  readonly levels = LEVELS;
  readonly data: LearningPathFormData;
  saving = false;
  error = '';

  readonly form = this.fb.group({
    title: ['', Validators.required],
    description: [''],
    classLevel: ['', Validators.required],
    delfTargetLevel: ['A1', Validators.required],
    minScore: [null as number | null, [Validators.min(0), Validators.max(100)]],
    maxScore: [null as number | null, [Validators.min(0), Validators.max(100)]],
    isDefault: [false],
    isActive: [true],
  });

  constructor(@Optional() @Inject(MAT_DIALOG_DATA) data: LearningPathFormData | null) {
    this.data = data ?? {};
  }

  get isEdit(): boolean {
    return !!this.data.path;
  }

  get selectedClassLevel(): string {
    return this.form.getRawValue().classLevel ?? '';
  }

  get recommendedDelf(): string {
    return DELF_TARGETS_BY_CLASS[this.selectedClassLevel] ?? '—';
  }

  get selectedDelfTrack(): string {
    return resolveDelfTrack(this.selectedClassLevel) ?? 'DELF';
  }

  get selectedDelfGroupLabel(): string {
    return resolveDelfGroupLabel(this.selectedClassLevel);
  }

  get availableDelfGroups() {
    return delfGroupsForClass(this.selectedClassLevel);
  }

  get availableDelfLevels(): string {
    return this.availableDelfGroups.flatMap((group) => group.levels).join(', ') || '—';
  }

  get scorePreview(): string {
    const raw = this.form.getRawValue();
    if (raw.minScore == null && raw.maxScore == null) return 'Tous scores';
    return `${raw.minScore ?? 0}% - ${raw.maxScore ?? 100}%`;
  }

  get submitLabel(): string {
    return this.isEdit ? 'Enregistrer' : 'Créer le parcours';
  }

  ngOnInit(): void {
    if (this.data.path) {
      this.form.patchValue({
        title: this.data.path.title,
        description: this.data.path.description ?? '',
        classLevel: this.data.path.classLevel,
        delfTargetLevel: this.data.path.delfTargetLevel,
        minScore: this.data.path.minScore ?? null,
        maxScore: this.data.path.maxScore ?? null,
        isDefault: this.data.path.isDefault,
        isActive: this.data.path.isActive,
      });
      this.form.get('classLevel')?.disable();
    } else {
      const firstLevel = this.levels[0];
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
    const raw = this.form.getRawValue();
    if (raw.minScore != null && raw.maxScore != null && raw.minScore > raw.maxScore) {
      this.error = 'Le score minimum ne peut pas dépasser le score maximum.';
      return;
    }
    this.saving = true;
    this.error = '';
    try {
      if (this.data.path) {
        await this.api.put(`/admin/learning-paths/${this.data.path.id}`, {
          title: raw.title,
          description: raw.description || null,
          delfTargetLevel: raw.delfTargetLevel,
          minScore: raw.minScore,
          maxScore: raw.maxScore,
          isDefault: raw.isDefault,
          isActive: raw.isActive,
        });
      } else {
        await this.api.post('/admin/learning-paths', {
          title: raw.title,
          description: raw.description || null,
          classLevel: raw.classLevel,
          delfTargetLevel: raw.delfTargetLevel,
          minScore: raw.minScore,
          maxScore: raw.maxScore,
          isDefault: raw.isDefault,
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
