import { Component, Inject, Optional, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { NgClass } from '@angular/common';

import { StoryOut } from '../../core/models/story.model';
import { ApiService } from '../../core/http/api.service';
import { AdminAuthService } from '../../core/auth/admin-auth.service';
import { LEVELS } from '../../core/constants/form-options';
import { AudioRecorderPickerComponent } from '../../shared/audio-recorder-picker/audio-recorder-picker.component';

export type StoryFormData = { row?: StoryOut | null };

@Component({
  selector: 'app-story-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatRadioModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    AudioRecorderPickerComponent,
    NgClass,
  ],
  template: `
    <div class="fd-wrap">
      <!-- header -->
      <div class="fd-header"
           [style.background]="data.row
             ? 'linear-gradient(135deg,#6366f1,#8b5cf6)'
             : 'linear-gradient(135deg,#ec4899,#a855f7)'">
        <div class="fd-header-icon">
          <mat-icon>auto_stories</mat-icon>
        </div>
        <div class="fd-header-text">
          <h2 class="fd-title">{{ data.row ? 'Modifier l\'histoire' : 'Nouvelle histoire' }}</h2>
          <span class="fd-sub">{{ data.row ? data.row.title : 'Ajouter un conte ou une lecture' }}</span>
        </div>
        <button class="fd-close" mat-dialog-close type="button">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="fd-body">
        <form [formGroup]="form">

          <!-- title -->
          <mat-form-field appearance="outline" class="fd-full">
            <mat-label>Titre de l'histoire</mat-label>
            <mat-icon matPrefix>title</mat-icon>
            <input matInput formControlName="title"
                   placeholder="Ex: Le Petit Prince" />
          </mat-form-field>

          <!-- level -->
          <mat-form-field appearance="outline" class="fd-full">
            <mat-label>Niveau scolaire</mat-label>
            <mat-icon matPrefix>school</mat-icon>
            <mat-select formControlName="level">
              @for (lvl of levels; track lvl) {
                <mat-option [value]="lvl">{{ lvl }}</mat-option>
              }
            </mat-select>
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

          <!-- content -->
          <mat-form-field appearance="outline" class="fd-full">
            <mat-label>Texte de l'histoire</mat-label>
            <mat-icon matPrefix>notes</mat-icon>
            <textarea matInput rows="6" formControlName="content"
                      placeholder="Écrivez ou collez le texte de l'histoire ici..."></textarea>
          </mat-form-field>

          <!-- audio url -->
          <div class="fd-section">
            <mat-icon>volume_up</mat-icon>
            Audio (optionnel)
          </div>

          <!-- audio radio: none / url -->
          <div class="fd-radio-group" style="margin-bottom:12px">
            <div class="fd-radios">
              <label class="fd-radio-card" [ngClass]="{selected: audioMode === 'none'}"
                     (click)="audioMode = 'none'">
                <mat-radio-button [checked]="audioMode === 'none'" color="primary"
                                  (change)="audioMode = 'none'"></mat-radio-button>
                <div class="fd-radio-info">
                  <mat-icon class="fd-radio-icon" style="color:#94a3b8">volume_off</mat-icon>
                  <span class="fd-radio-name">Sans audio</span>
                  <span class="fd-radio-desc">Lecture textuelle uniquement</span>
                </div>
              </label>
              <label class="fd-radio-card" [ngClass]="{selected: audioMode === 'url'}"
                     (click)="audioMode = 'url'">
                <mat-radio-button [checked]="audioMode === 'url'" color="primary"
                                  (change)="audioMode = 'url'"></mat-radio-button>
                <div class="fd-radio-info">
                  <mat-icon class="fd-radio-icon" style="color:#06b6d4">mic</mat-icon>
                  <span class="fd-radio-name">Avec audio</span>
                  <span class="fd-radio-desc">Lien vers le fichier audio</span>
                </div>
              </label>
            </div>
          </div>

          @if (audioMode === 'url') {
            <app-audio-recorder-picker
              [audioUrl]="form.controls.audioUrl.value"
              [title]="form.controls.title.value || 'Audio histoire'"
              [ownerType]="data.row ? 'story' : null"
              [ownerId]="data.row?.id ?? null"
              [disabled]="saving"
              (audioUrlChange)="setAudioUrl($event)"
              (busyChange)="audioBusy = $event"
              (errorChange)="onAudioError($event)"
            />
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
                [disabled]="form.invalid || saving || audioBusy">
          @if (saving) {
            <mat-spinner diameter="18" class="fd-spinner"></mat-spinner>
          } @else {
            <mat-icon>{{ data.row ? 'save' : 'add_circle' }}</mat-icon>
          }
          {{ data.row ? 'Enregistrer' : 'Créer l\'histoire' }}
        </button>
      </div>
    </div>
  `,
	  styles: [`
	    @use '../../shared/form-dialog';
	  `],
})
export class StoryFormDialogComponent {
  private readonly api = inject(ApiService);
  readonly auth = inject(AdminAuthService);
  private readonly fb  = inject(FormBuilder);

  readonly levels = LEVELS;
  audioMode: 'none' | 'url' = 'none';
  saving = false;
  audioBusy = false;
  error  = '';

  form = this.fb.nonNullable.group({
    title:    ['', Validators.required],
    content:  ['', Validators.required],
    level:    [LEVELS[0], Validators.required],
    visibility: ['public', Validators.required],
    audioUrl: [''],
  });

  constructor(
    private readonly dialogRef: MatDialogRef<StoryFormDialogComponent, boolean>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: StoryFormData,
  ) {
    this.data = data ?? {};
    if (this.data.row) {
      const s = this.data.row;
      this.form.patchValue({
        title: s.title, content: s.content,
        level: s.level,
        visibility: s.visibility || 'public',
        audioUrl: s.audioUrl || '',
      });
      this.audioMode = s.audioUrl ? 'url' : 'none';
    }
  }

  async save(): Promise<void> {
    if (this.form.invalid) return;
    this.saving = true;
    this.error  = '';
    try {
      const v = this.form.getRawValue();
      const body = {
        title:    v.title,
        content:  v.content,
        level:    v.level,
        visibility: v.visibility,
        audioUrl: this.audioMode === 'url' && v.audioUrl ? v.audioUrl : null,
      };
      const base = this.auth.isProf() ? '/prof/stories' : '/admin/stories';
      if (this.data.row) {
        await this.api.put<StoryOut>(`${base}/${this.data.row.id}`, body);
      } else {
        await this.api.post<StoryOut>(base, body);
      }
      this.dialogRef.close(true);
    } catch {
      this.error = 'Erreur lors de la sauvegarde.';
    } finally {
      this.saving = false;
    }
  }

  setAudioUrl(url: string): void {
    this.form.patchValue({ audioUrl: url });
    this.audioMode = 'url';
  }

  onAudioError(message: string): void {
    if (message) this.error = message;
  }
}
