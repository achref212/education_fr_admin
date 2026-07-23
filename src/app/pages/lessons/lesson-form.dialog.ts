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
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { LessonOut } from '../../core/models/lesson.model';
import { ApiService } from '../../core/http/api.service';
import { AdminAuthService } from '../../core/auth/admin-auth.service';
import { LEVELS, LESSON_CATEGORIES } from '../../core/constants/form-options';

export type LessonFormData = { lesson?: LessonOut | null };

@Component({
  selector: 'app-lesson-form-dialog',
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
  ],
  template: `
    <div class="fd-wrap">
      <!-- header -->
      <div class="fd-header"
           [style.background]="data.lesson
             ? 'linear-gradient(135deg,#6366f1,#8b5cf6)'
             : 'linear-gradient(135deg,#10b981,#06b6d4)'">
        <div class="fd-header-icon">
          <mat-icon>menu_book</mat-icon>
        </div>
        <div class="fd-header-text">
          <h2 class="fd-title">{{ data.lesson ? 'Modifier la leçon' : 'Nouvelle leçon' }}</h2>
          <span class="fd-sub">{{ data.lesson ? data.lesson.title : 'Ajouter du contenu pédagogique' }}</span>
        </div>
        <button class="fd-close" mat-dialog-close type="button">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="fd-body">
        <form [formGroup]="form">

          <!-- title -->
          <mat-form-field appearance="outline" class="fd-full">
            <mat-label>Titre de la leçon</mat-label>
            <mat-icon matPrefix>title</mat-icon>
            <input matInput formControlName="title" placeholder="Ex: Les articles définis" />
          </mat-form-field>

          <!-- content -->
          <mat-form-field appearance="outline" class="fd-full">
            <mat-label>Contenu</mat-label>
            <mat-icon matPrefix>notes</mat-icon>
            <textarea matInput rows="5" formControlName="content"
                      placeholder="Expliquez la leçon en détail..."></textarea>
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

          <!-- sort order -->
          <mat-form-field appearance="outline" class="fd-full">
            <mat-label>Ordre d'affichage</mat-label>
            <mat-icon matPrefix>sort</mat-icon>
            <input matInput type="number" formControlName="sortOrder"
                   placeholder="1" min="0" />
            <mat-hint>Les leçons sont triées par cet ordre croissant</mat-hint>
          </mat-form-field>

          @if (auth.isProf()) {
            <mat-form-field appearance="outline" class="fd-full">
              <mat-label>Visibilité</mat-label>
              <mat-icon matPrefix>visibility</mat-icon>
              <mat-select formControlName="visibility">
                <mat-option value="public">Publié pour tous</mat-option>
                <mat-option value="school">Privé à mon établissement</mat-option>
              </mat-select>
            </mat-form-field>
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
            <mat-icon>{{ data.lesson ? 'save' : 'add_circle' }}</mat-icon>
          }
          {{ data.lesson ? 'Enregistrer' : 'Créer la leçon' }}
        </button>
      </div>
    </div>
  `,
  styles: [`@use '../../shared/form-dialog';`],
})
export class LessonFormDialogComponent {
  private readonly api = inject(ApiService);
  readonly auth = inject(AdminAuthService);
  private readonly fb  = inject(FormBuilder);

  readonly levels     = LEVELS;
  readonly categories = LESSON_CATEGORIES;
  saving = false;
  error  = '';

  form = this.fb.nonNullable.group({
    title:     ['', Validators.required],
    content:   ['', Validators.required],
    category:  [LESSON_CATEGORIES[0], Validators.required],
    level:     [LEVELS[0], Validators.required],
    sortOrder: [0, Validators.required],
    visibility: ['public', Validators.required],
  });

  constructor(
    private readonly dialogRef: MatDialogRef<LessonFormDialogComponent, boolean>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: LessonFormData,
  ) {
    this.data = data ?? {};
    if (this.data.lesson) {
      const l = this.data.lesson;
      this.form.patchValue({
        title: l.title, content: l.content,
        category: l.category, level: l.level, sortOrder: l.sortOrder,
        visibility: l.visibility || 'public',
      });
    }
  }

  async save(): Promise<void> {
    if (this.form.invalid) return;
    this.saving = true;
    this.error  = '';
    try {
      const v = this.form.getRawValue();
      const body = {
        title: v.title,
        content: v.content,
        category: v.category,
        level: v.level,
        sortOrder: v.sortOrder,
        visibility: v.visibility,
      };
      const isProf = this.auth.isProf();
      const base = isProf ? '/prof/lessons' : '/admin/lessons';
      if (this.data.lesson) {
        await this.api.put<LessonOut>(`${base}/${this.data.lesson.id}`, body);
      } else {
        await this.api.post<LessonOut>(base, body);
      }
      this.dialogRef.close(true);
    } catch {
      this.error = 'Erreur lors de la sauvegarde.';
    } finally {
      this.saving = false;
    }
  }
}
