import { Component, Inject, Optional, inject, signal } from '@angular/core';
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
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';

import { QuizQuestionOut } from '../../core/models/quiz.model';
import { ApiService } from '../../core/http/api.service';
import { LEVELS, QUIZ_CATEGORIES } from '../../core/constants/form-options';

export type QuizFormData = { row?: QuizQuestionOut | null };

@Component({
  selector: 'app-quiz-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
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
      <div class="fd-header"
           [style.background]="data.row
             ? 'linear-gradient(135deg,#6366f1,#8b5cf6)'
             : 'linear-gradient(135deg,#f59e0b,#f97316)'">
        <div class="fd-header-icon">
          <mat-icon>quiz</mat-icon>
        </div>
        <div class="fd-header-text">
          <h2 class="fd-title">{{ data.row ? 'Modifier la question' : 'Nouvelle question' }}</h2>
          <span class="fd-sub">{{ data.row ? data.row.question : 'QCM avec explication' }}</span>
        </div>
        <button class="fd-close" mat-dialog-close type="button">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="fd-body">
        <form [formGroup]="form">

          <!-- question -->
          <mat-form-field appearance="outline" class="fd-full">
            <mat-label>Question</mat-label>
            <mat-icon matPrefix>help_outline</mat-icon>
            <textarea matInput rows="2" formControlName="question"
                      placeholder="Ex: Quel est le pluriel de cheval ?"></textarea>
          </mat-form-field>

          <!-- category + level -->
          <div class="fd-row">
            <mat-form-field appearance="outline" class="fd-field">
              <mat-label>Catégorie</mat-label>
              <mat-icon matPrefix>category</mat-icon>
              <mat-select formControlName="category">
                @for (cat of categories; track cat) {
                  <mat-option [value]="cat">{{ cat }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline" class="fd-field">
              <mat-label>Niveau</mat-label>
              <mat-icon matPrefix>school</mat-icon>
              <mat-select formControlName="level">
                @for (lvl of levels; track lvl) {
                  <mat-option [value]="lvl">{{ lvl }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
          </div>

          <!-- options + correct answer -->
          <div class="fd-section">
            <mat-icon>list</mat-icon>
            Options de réponse — cochez la bonne réponse
          </div>

          <div class="fd-options">
            @for (opt of options(); track $index; let i = $index) {
              <div class="fd-option-row" [class.correct]="correctIndex() === i">
                <span class="opt-idx">{{ i + 1 }}</span>
                <input
                  [(ngModel)]="options()[i]"
                  [ngModelOptions]="{standalone: true}"
                  (ngModelChange)="updateOptions()"
                  placeholder="Option {{ i + 1 }}"
                />
                @if (correctIndex() === i) {
                  <span class="opt-correct-badge">✓ Correct</span>
                }
                <mat-radio-button
                  [checked]="correctIndex() === i"
                  (change)="setCorrect(i)"
                  color="primary">
                </mat-radio-button>
              </div>
            }
          </div>

          <!-- explanation -->
          <mat-form-field appearance="outline" class="fd-full">
            <mat-label>Explication (optionnel)</mat-label>
            <mat-icon matPrefix>lightbulb</mat-icon>
            <textarea matInput rows="2" formControlName="explanation"
                      placeholder="Expliquez pourquoi cette réponse est correcte..."></textarea>
          </mat-form-field>

          @if (optionError) {
            <div class="fd-error">
              <mat-icon>error_outline</mat-icon>{{ optionError }}
            </div>
          }
          @if (error) {
            <div class="fd-error">
              <mat-icon>error_outline</mat-icon>{{ error }}
            </div>
          }
        </form>
      </div>

      <div class="fd-footer">
        <button class="fd-btn-cancel" mat-dialog-close type="button">Annuler</button>
        <button class="fd-btn-save" type="button" (click)="save()"
                [disabled]="form.invalid || saving">
          @if (saving) {
            <mat-spinner diameter="18" class="fd-spinner"></mat-spinner>
          } @else {
            <mat-icon>{{ data.row ? 'save' : 'add_circle' }}</mat-icon>
          }
          {{ data.row ? 'Enregistrer' : 'Créer la question' }}
        </button>
      </div>
    </div>
  `,
  styles: [`@use '../../shared/form-dialog';`],
})
export class QuizFormDialogComponent {
  private readonly api = inject(ApiService);
  private readonly fb  = inject(FormBuilder);

  readonly levels     = LEVELS;
  readonly categories = QUIZ_CATEGORIES;
  saving       = false;
  error        = '';
  optionError  = '';

  options      = signal<string[]>(['', '', '', '']);
  correctIndex = signal<number>(0);

  form = this.fb.nonNullable.group({
    question:    ['', Validators.required],
    category:    [QUIZ_CATEGORIES[0], Validators.required],
    level:       [LEVELS[0], Validators.required],
    explanation: [''],
  });

  constructor(
    private readonly dialogRef: MatDialogRef<QuizFormDialogComponent, boolean>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: QuizFormData,
  ) {
    this.data = data ?? {};
    if (this.data.row) {
      const r = this.data.row;
      this.form.patchValue({
        question:    r.question,
        category:    r.category,
        level:       r.level,
        explanation: r.explanation || '',
      });
      const opts = [...(r.options || [])];
      while (opts.length < 4) opts.push('');
      this.options.set(opts);
      this.correctIndex.set(r.correctIndex ?? 0);
    }
  }

  setCorrect(i: number): void { this.correctIndex.set(i); }

  updateOptions(): void { this.optionError = ''; }

  async save(): Promise<void> {
    if (this.form.invalid) return;
    const rawOptions = this.options().map((o) => o.trim());
    const opts = rawOptions.filter((o) => o.length > 0);
    if (opts.length < 2) {
      this.optionError = 'Saisissez au moins 2 options de réponse.';
      return;
    }
    const selectedRaw = rawOptions[this.correctIndex()] ?? '';
    let correctIndex = selectedRaw ? opts.indexOf(selectedRaw) : -1;
    if (correctIndex < 0) {
      this.optionError = 'Sélectionnez une réponse correcte parmi les options remplies.';
      return;
    }
    this.saving = true;
    this.error  = '';
    this.optionError = '';
    try {
      const v = this.form.getRawValue();
      const payload = {
        question:     v.question,
        options:      opts,
        correctIndex,
        explanation:  v.explanation || null,
        category:     v.category,
        level:        v.level,
      };
      if (this.data.row) {
        await this.api.put<QuizQuestionOut>(`/admin/quiz-questions/${this.data.row.id}`, payload);
      } else {
        await this.api.post<QuizQuestionOut>('/admin/quiz-questions', payload);
      }
      this.dialogRef.close(true);
    } catch {
      this.error = 'Erreur lors de la sauvegarde.';
    } finally {
      this.saving = false;
    }
  }
}
