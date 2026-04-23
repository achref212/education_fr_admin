import { Component, Inject, inject, Optional } from '@angular/core';
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

import { LessonOut } from '../../core/models/lesson.model';
import { ApiService } from '../../core/http/api.service';

export type LessonFormData = { lesson?: LessonOut | null };

@Component({
  selector: 'app-lesson-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.lesson ? 'Modifier la leçon' : 'Nouvelle leçon' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="form">
        <mat-form-field appearance="outline" class="w100">
          <mat-label>Titre</mat-label>
          <input matInput formControlName="title" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="w100">
          <mat-label>Contenu</mat-label>
          <textarea matInput rows="5" formControlName="content"></textarea>
        </mat-form-field>
        <div class="row">
          <mat-form-field appearance="outline" class="grow">
            <mat-label>Catégorie</mat-label>
            <input matInput formControlName="category" />
          </mat-form-field>
          <mat-form-field appearance="outline" class="grow">
            <mat-label>Niveau</mat-label>
            <input matInput formControlName="level" />
          </mat-form-field>
          <mat-form-field appearance="outline" class="ord">
            <mat-label>Ordre</mat-label>
            <input matInput type="number" formControlName="sortOrder" />
          </mat-form-field>
        </div>
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
        max-width: 560px;
      }
      .w100 {
        width: 100%;
        display: block;
        margin-top: 0.5rem;
      }
      .row {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        align-items: center;
      }
      .grow {
        flex: 1 1 120px;
        min-width: 100px;
      }
      .ord {
        width: 100px;
      }
    `,
  ],
})
export class LessonFormDialogComponent {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);

  form = this.fb.nonNullable.group({
    title: ['', Validators.required],
    content: ['', Validators.required],
    category: ['', Validators.required],
    level: ['', Validators.required],
    sortOrder: [0, Validators.required],
  });

  constructor(
    private readonly dialogRef: MatDialogRef<LessonFormDialogComponent, boolean>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: LessonFormData,
  ) {
    this.data = data || {};
    if (this.data.lesson) {
      const l = this.data.lesson;
      this.form.patchValue({
        title: l.title,
        content: l.content,
        category: l.category,
        level: l.level,
        sortOrder: l.sortOrder,
      });
    }
  }

  async save(): Promise<void> {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    if (this.data.lesson) {
      await this.api.put<LessonOut>(`/admin/lessons/${this.data.lesson.id}`, {
        title: v.title,
        content: v.content,
        category: v.category,
        level: v.level,
        sortOrder: v.sortOrder,
      });
    } else {
      await this.api.post<LessonOut>('/admin/lessons', {
        title: v.title,
        content: v.content,
        category: v.category,
        level: v.level,
        sortOrder: v.sortOrder,
      });
    }
    this.dialogRef.close(true);
  }
}
