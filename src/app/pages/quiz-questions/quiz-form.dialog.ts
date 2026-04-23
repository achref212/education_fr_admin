import { Component, Inject, Optional, inject } from '@angular/core';
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

import { QuizQuestionOut } from '../../core/models/quiz.model';
import { ApiService } from '../../core/http/api.service';

export type QuizFormData = { row?: QuizQuestionOut | null };

@Component({
  selector: 'app-quiz-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>
      {{ data.row ? 'Modifier la question' : 'Nouvelle question' }}
    </h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="form">
        <mat-form-field appearance="outline" class="w100">
          <mat-label>Question</mat-label>
          <textarea matInput rows="2" formControlName="question"></textarea>
        </mat-form-field>
        <mat-form-field appearance="outline" class="w100">
          <mat-label>Options (une par ligne)</mat-label>
          <textarea matInput rows="4" formControlName="optionsText"></textarea>
        </mat-form-field>
        <div class="row">
          <mat-form-field appearance="outline" class="ix">
            <mat-label>Index correct</mat-label>
            <input matInput type="number" formControlName="correctIndex" />
          </mat-form-field>
          <mat-form-field appearance="outline" class="grow">
            <mat-label>Catégorie</mat-label>
            <input matInput formControlName="category" />
          </mat-form-field>
          <mat-form-field appearance="outline" class="grow">
            <mat-label>Niveau</mat-label>
            <input matInput formControlName="level" />
          </mat-form-field>
        </div>
        <mat-form-field appearance="outline" class="w100">
          <mat-label>Explication (optionnel)</mat-label>
          <textarea matInput rows="2" formControlName="explanation"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" mat-dialog-close>Annuler</button>
      <button
        mat-raised-button
        color="primary"
        type="button"
        (click)="save()"
        [disabled]="form.invalid"
      >
        Enregistrer
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .form {
        min-width: 400px;
        max-width: 600px;
      }
      .w100 {
        width: 100%;
        display: block;
        margin-top: 0.5rem;
      }
      .row {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }
      .grow {
        flex: 1 1 140px;
        min-width: 100px;
      }
      .ix {
        width: 120px;
      }
    `,
  ],
})
export class QuizFormDialogComponent {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);

  form = this.fb.nonNullable.group({
    question: ['', Validators.required],
    optionsText: ['', Validators.required],
    correctIndex: [0, [Validators.required, Validators.min(0)]],
    explanation: [''],
    category: ['', Validators.required],
    level: ['', Validators.required],
  });

  constructor(
    private readonly dialogRef: MatDialogRef<QuizFormDialogComponent, boolean>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: QuizFormData,
  ) {
    this.data = data || {};
    if (this.data.row) {
      const r = this.data.row;
      this.form.patchValue({
        question: r.question,
        optionsText: (r.options || []).join('\n'),
        correctIndex: r.correctIndex,
        explanation: r.explanation || '',
        category: r.category,
        level: r.level,
      });
    }
  }

  private _parseOptions(): string[] {
    return this.form
      .getRawValue()
      .optionsText.split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }

  async save(): Promise<void> {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    const options = this._parseOptions();
    if (options.length < 2) {
      return;
    }
    if (v.correctIndex < 0 || v.correctIndex >= options.length) {
      return;
    }
    const payload = {
      question: v.question,
      options,
      correctIndex: v.correctIndex,
      explanation: v.explanation || null,
      category: v.category,
      level: v.level,
    };
    if (this.data.row) {
      await this.api.put<QuizQuestionOut>(
        `/admin/quiz-questions/${this.data.row.id}`,
        payload,
      );
    } else {
      await this.api.post<QuizQuestionOut>('/admin/quiz-questions', payload);
    }
    this.dialogRef.close(true);
  }
}
