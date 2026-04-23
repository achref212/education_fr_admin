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

import { StoryOut } from '../../core/models/story.model';
import { ApiService } from '../../core/http/api.service';

export type StoryFormData = { row?: StoryOut | null };

@Component({
  selector: 'app-story-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.row ? 'Modifier' : 'Nouvelle histoire' }}</h2>
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
        <mat-form-field appearance="outline" class="w100">
          <mat-label>Niveau</mat-label>
          <input matInput formControlName="level" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="w100">
          <mat-label>URL audio (optionnel)</mat-label>
          <input matInput formControlName="audioUrl" />
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
      }
      .w100 {
        width: 100%;
        display: block;
        margin-top: 0.5rem;
      }
    `,
  ],
})
export class StoryFormDialogComponent {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);

  form = this.fb.nonNullable.group({
    title: ['', Validators.required],
    content: ['', Validators.required],
    level: ['', Validators.required],
    audioUrl: [''],
  });

  constructor(
    private readonly dialogRef: MatDialogRef<StoryFormDialogComponent, boolean>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: StoryFormData,
  ) {
    this.data = data || {};
    if (this.data.row) {
      const s = this.data.row;
      this.form.patchValue({
        title: s.title,
        content: s.content,
        level: s.level,
        audioUrl: s.audioUrl || '',
      });
    }
  }

  async save(): Promise<void> {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    const body = {
      title: v.title,
      content: v.content,
      level: v.level,
      audioUrl: v.audioUrl || null,
    };
    if (this.data.row) {
      await this.api.put<StoryOut>(`/admin/stories/${this.data.row.id}`, body);
    } else {
      await this.api.post<StoryOut>('/admin/stories', body);
    }
    this.dialogRef.close(true);
  }
}
