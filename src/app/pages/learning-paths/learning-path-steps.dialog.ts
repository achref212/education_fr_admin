import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';

import { QUIZ_CATEGORIES } from '../../core/constants/form-options';
import { ApiService } from '../../core/http/api.service';
import { LearningPathOut, LearningPathStepOut } from '../../core/models/learning-path.model';
import { LessonOut } from '../../core/models/lesson.model';
import { QuizQuestionOut } from '../../core/models/quiz.model';
import { StoryOut } from '../../core/models/story.model';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../shared/confirm-dialog/confirm-dialog.component';

export interface LearningPathStepsData {
  path: LearningPathOut;
}

@Component({
  selector: 'app-learning-path-steps-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSelectModule,
  ],
  template: `
    <div class="steps-wrap">
      <div class="steps-header">
        <div class="steps-heading">
          <div class="steps-icon"><mat-icon>route</mat-icon></div>
          <div>
            <h2>{{ data.path.title }}</h2>
            <p>{{ data.path.classLevel }} · DELF {{ data.path.delfTargetLevel }} · {{ scoreRange }}</p>
          </div>
        </div>
        <button type="button" class="steps-close" (click)="dialogRef.close()"><mat-icon>close</mat-icon></button>
      </div>

      <div class="steps-summary">
        <div>
          <span class="summary-label">Étapes</span>
          <strong>{{ steps().length }}</strong>
        </div>
        <div>
          <span class="summary-label">Élèves affectés</span>
          <strong>{{ data.path.assignedUsersCount || 0 }}</strong>
        </div>
        <div>
          <span class="summary-label">Statut</span>
          <strong>{{ data.path.isActive ? 'Actif' : 'Inactif' }}</strong>
        </div>
        <div>
          <span class="summary-label">Défaut</span>
          <strong>{{ data.path.isDefault ? 'Oui' : 'Non' }}</strong>
        </div>
        <div>
          <span class="summary-label">Score DELF</span>
          <strong>{{ scoreRange }}</strong>
        </div>
        <div>
          <span class="summary-label">Créé le</span>
          <strong>{{ data.path.createdAt | date:'dd/MM/yyyy' }}</strong>
        </div>
      </div>

      @if (data.path.description) {
        <p class="steps-description">{{ data.path.description }}</p>
      }
      <div class="steps-meta-line">
        <span>ID {{ data.path.id }}</span>
        <span>Objectif {{ data.path.delfTargetLevel }}</span>
        <span>{{ data.path.classLevel }}</span>
      </div>

      @if (loading()) {
        <div class="steps-loading"><mat-spinner diameter="28" /><span>Chargement…</span></div>
      } @else {
        <div class="steps-content">
          <section class="steps-panel">
            <div class="panel-title">
              <mat-icon>list_alt</mat-icon>
              <span>Étapes du parcours</span>
            </div>
            @if (steps().length === 0) {
              <div class="steps-empty">
                <mat-icon>playlist_add</mat-icon>
                <p>Aucune étape définie.</p>
              </div>
            } @else {
              <div class="steps-list">
                @for (step of steps(); track step.id) {
                  <div class="steps-item">
                    <span class="steps-order">{{ step.stepOrder }}</span>
                    <div class="steps-body">
                      <strong>{{ step.title }}</strong>
                      <span>
                        {{ stepTypeLabel(step.stepType) }} · +{{ step.xpReward }} XP
                        @if (linkedContentLabel(step)) { · {{ linkedContentLabel(step) }} }
                      </span>
                      @if (requiredStepLabel(step)) {
                        <small>Après : {{ requiredStepLabel(step) }}</small>
                      }
                    </div>
                    <button type="button" class="steps-delete" (click)="confirmDelete(step)" title="Supprimer">
                      <mat-icon>delete_outline</mat-icon>
                    </button>
                  </div>
                }
              </div>
            }
          </section>

          <section class="steps-panel">
            <div class="panel-title">
              <mat-icon>add_circle</mat-icon>
              <span>Ajouter une étape</span>
            </div>

            @if (missingMessage()) {
              <div class="steps-prereq">
                <mat-icon>info</mat-icon>
                <div>
                  <strong>{{ missingMessage() }}</strong>
                  <p>{{ missingHint() }}</p>
                </div>
                <button type="button" class="route-btn" (click)="goToMissingRoute()">
                  <mat-icon>open_in_new</mat-icon>
                  Ouvrir
                </button>
              </div>
            }

            <form class="steps-form" [formGroup]="form">
              <div class="step-type-grid">
                <button type="button" class="step-type-card" [class.active]="selectedType === 'lesson'" (click)="setStepType('lesson')">
                  <mat-icon>menu_book</mat-icon>
                  <span>Leçon</span>
                  <small>{{ lessonsForLevel().length }} contenu(s)</small>
                </button>
                <button type="button" class="step-type-card" [class.active]="selectedType === 'quiz'" (click)="setStepType('quiz')">
                  <mat-icon>quiz</mat-icon>
                  <span>Quiz</span>
                  <small>{{ availableQuizCategories().length }} catégorie(s)</small>
                </button>
                <button type="button" class="step-type-card" [class.active]="selectedType === 'story'" (click)="setStepType('story')">
                  <mat-icon>auto_stories</mat-icon>
                  <span>Histoire</span>
                  <small>{{ storiesForLevel().length }} contenu(s)</small>
                </button>
              </div>

              <div class="steps-row">
                <mat-form-field appearance="outline">
                  <mat-label>Ordre</mat-label>
                  <input matInput type="number" min="1" formControlName="stepOrder" />
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>XP</mat-label>
                  <input matInput type="number" min="1" formControlName="xpReward" />
                </mat-form-field>
              </div>

              <mat-form-field appearance="outline" class="full">
                <mat-label>Titre</mat-label>
                <input matInput formControlName="title" placeholder="Ex: Comprendre le présent" />
              </mat-form-field>

              @if (selectedType === 'lesson') {
                <mat-form-field appearance="outline" class="full">
                  <mat-label>Leçon</mat-label>
                  <mat-select formControlName="lessonId">
                    @for (lesson of lessonsForLevel(); track lesson.id) {
                      <mat-option [value]="lesson.id">{{ lesson.title }} · {{ lesson.category }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
              }

              @if (selectedType === 'quiz') {
                <mat-form-field appearance="outline" class="full">
                  <mat-label>Catégorie quiz</mat-label>
                  <mat-select formControlName="quizCategory">
                    @for (category of availableQuizCategories(); track category) {
                      <mat-option [value]="category">{{ category }} · {{ quizCount(category) }} question(s)</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
              }

              @if (selectedType === 'story') {
                <mat-form-field appearance="outline" class="full">
                  <mat-label>Histoire</mat-label>
                  <mat-select formControlName="storyId">
                    @for (story of storiesForLevel(); track story.id) {
                      <mat-option [value]="story.id">{{ story.title }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
              }

              <mat-form-field appearance="outline" class="full">
                <mat-label>Prérequis</mat-label>
                <mat-select formControlName="requiredStepId">
                  <mat-option [value]="null">Aucun</mat-option>
                  @for (step of steps(); track step.id) {
                    <mat-option [value]="step.id">{{ step.stepOrder }} · {{ step.title }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>

              @if (error()) {
                <div class="steps-error"><mat-icon>error_outline</mat-icon>{{ error() }}</div>
              }

              <button type="button" class="submit-btn" [disabled]="saving() || form.invalid || !!missingMessage()" (click)="addStep()">
                @if (saving()) { <mat-spinner diameter="18" /> } @else { <mat-icon>save</mat-icon> }
                Ajouter l'étape
              </button>
            </form>
          </section>
        </div>
      }
    </div>
  `,
  styles: [`
    .steps-wrap { width: min(1040px, 96vw); background: var(--clr-surface); color: var(--clr-text); border-radius: 20px; overflow: hidden; }
    .steps-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; padding: 20px 22px; background: linear-gradient(135deg,#6366f1,#06b6d4); color: white; }
    .steps-heading { display: flex; align-items: center; gap: 14px; min-width: 0; }
    .steps-heading h2 { margin: 0 0 4px; font-size: 20px; line-height: 1.2; }
    .steps-heading p { margin: 0; font-size: 13px; opacity: .86; }
    .steps-icon { width: 44px; height: 44px; border-radius: 14px; background: rgba(255,255,255,.18); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .steps-close { width: 34px; height: 34px; border: none; border-radius: 10px; background: rgba(255,255,255,.15); color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; }
    .steps-summary { display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; padding: 16px 22px; border-bottom: 1px solid var(--clr-border); background: color-mix(in srgb, var(--clr-surface-2) 45%, var(--clr-surface)); }
    .steps-summary div { padding: 10px 12px; border: 1px solid var(--clr-border); border-radius: 12px; background: var(--clr-surface); }
    .summary-label { display: block; margin-bottom: 4px; color: var(--clr-text-muted); font-size: 11px; font-weight: 700; text-transform: uppercase; }
    .steps-summary strong { font-size: 15px; }
    .steps-description { margin: 0; padding: 14px 22px; color: var(--clr-text-muted); border-bottom: 1px solid var(--clr-border); font-size: 13px; line-height: 1.5; }
    .steps-meta-line { display: flex; flex-wrap: wrap; gap: 8px; padding: 12px 22px; border-bottom: 1px solid var(--clr-border); color: var(--clr-text-muted); font-size: 12px; }
    .steps-meta-line span { padding: 4px 8px; border-radius: 8px; background: var(--clr-surface-2); border: 1px solid var(--clr-border); }
    .steps-loading { display: flex; align-items: center; justify-content: center; gap: 12px; min-height: 260px; color: var(--clr-text-muted); }
    .steps-content { display: grid; grid-template-columns: minmax(0, 1fr) 390px; gap: 16px; padding: 18px 22px 22px; }
    .steps-panel { min-width: 0; border: 1px solid var(--clr-border); border-radius: 14px; background: var(--clr-surface-2); overflow: hidden; }
    .panel-title { display: flex; align-items: center; gap: 8px; padding: 14px 16px; border-bottom: 1px solid var(--clr-border); font-size: 13px; font-weight: 800; }
    .panel-title mat-icon { color: var(--clr-primary); }
    .steps-empty { min-height: 180px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; color: var(--clr-text-muted); }
    .steps-list { max-height: 520px; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 8px; }
    .steps-item { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 12px; border: 1px solid var(--clr-border); background: var(--clr-surface); }
    .steps-order { width: 32px; height: 32px; border-radius: 9px; background: rgba(99,102,241,.14); color: var(--clr-primary); font-weight: 800; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .steps-body { min-width: 0; flex: 1; display: flex; flex-direction: column; gap: 3px; }
    .steps-body strong { font-size: 14px; }
    .steps-body span, .steps-body small { color: var(--clr-text-muted); font-size: 12px; }
    .steps-delete { width: 34px; height: 34px; border: none; border-radius: 10px; color: #fca5a5; background: transparent; cursor: pointer; display: flex; align-items: center; justify-content: center; }
    .steps-delete:hover { background: rgba(239,68,68,.14); }
    .steps-form { padding: 14px 16px 16px; }
    .step-type-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 12px; }
    .step-type-card {
      min-width: 0;
      border: 1px solid var(--clr-border);
      border-radius: 13px;
      background: var(--clr-surface);
      color: var(--clr-text);
      padding: 10px 8px;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 3px;
      transition: border-color .2s ease, background .2s ease, transform .2s ease;
    }
    .step-type-card mat-icon { color: var(--clr-text-muted); font-size: 20px; width: 20px; height: 20px; }
    .step-type-card span { font-size: 12px; font-weight: 800; }
    .step-type-card small { color: var(--clr-text-muted); font-size: 10px; line-height: 1.2; text-align: center; }
    .step-type-card:hover { transform: translateY(-1px); border-color: color-mix(in srgb, var(--clr-primary) 42%, var(--clr-border)); }
    .step-type-card.active {
      border-color: color-mix(in srgb, var(--clr-primary) 72%, var(--clr-border));
      background: color-mix(in srgb, var(--clr-primary) 12%, var(--clr-surface));
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--clr-primary) 12%, transparent);
    }
    .step-type-card.active mat-icon { color: var(--clr-primary-light); }
    .steps-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .full { width: 100%; }
    .steps-prereq { display: grid; grid-template-columns: auto 1fr auto; gap: 10px; align-items: center; margin: 14px 16px 0; padding: 12px; border-radius: 12px; border: 1px solid rgba(245,158,11,.28); background: rgba(245,158,11,.09); }
    .steps-prereq mat-icon { color: #f59e0b; }
    .steps-prereq strong { display: block; font-size: 13px; }
    .steps-prereq p { margin: 2px 0 0; color: var(--clr-text-muted); font-size: 12px; line-height: 1.35; }
    .route-btn, .submit-btn { border: none; border-radius: 11px; color: white; background: linear-gradient(135deg,#6366f1,#8b5cf6); font-weight: 800; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 7px; }
    .route-btn { padding: 9px 12px; font-size: 12px; }
    .submit-btn { width: 100%; min-height: 42px; padding: 10px 14px; }
    .submit-btn:disabled { opacity: .55; cursor: not-allowed; }
    .steps-error { display: flex; align-items: center; gap: 8px; color: #fca5a5; font-size: 12px; margin-bottom: 12px; }
    ::ng-deep .steps-wrap .mat-mdc-form-field { width: 100%; }
    @media (max-width: 860px) {
      .steps-summary { grid-template-columns: 1fr 1fr; }
      .steps-content { grid-template-columns: 1fr; }
    }
  `],
})
export class LearningPathStepsDialogComponent implements OnInit {
  readonly data = inject<LearningPathStepsData>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<LearningPathStepsDialogComponent>);
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly steps = signal<LearningPathStepOut[]>([]);
  readonly lessons = signal<LessonOut[]>([]);
  readonly stories = signal<StoryOut[]>([]);
  readonly questions = signal<QuizQuestionOut[]>([]);
  readonly error = signal('');

  readonly lessonsForLevel = computed(() =>
    this.lessons().filter((lesson) => lesson.level === this.data.path.classLevel),
  );
  readonly storiesForLevel = computed(() =>
    this.stories().filter((story) => story.level === this.data.path.classLevel),
  );
  readonly availableQuizCategories = computed(() =>
    QUIZ_CATEGORIES.filter((category) => this.quizCount(category) > 0),
  );

  readonly form = this.fb.group({
    stepType: ['lesson', Validators.required],
    stepOrder: [1, [Validators.required, Validators.min(1)]],
    title: ['', Validators.required],
    xpReward: [10, [Validators.required, Validators.min(1)]],
    lessonId: [null as string | null],
    storyId: [null as string | null],
    quizCategory: [null as string | null],
    requiredStepId: [null as string | null],
  });

  get selectedType(): string {
    return this.form.getRawValue().stepType || 'lesson';
  }

  get scoreRange(): string {
    if (this.data.path.minScore == null && this.data.path.maxScore == null) return 'Tous scores';
    return `${this.data.path.minScore ?? 0}% - ${this.data.path.maxScore ?? 100}%`;
  }

  ngOnInit(): void {
    void this.loadAll();
  }

  async loadAll(): Promise<void> {
    this.loading.set(true);
    try {
      const [steps, lessons, stories, questions] = await Promise.all([
        this.api.get<LearningPathStepOut[]>(`/admin/learning-paths/${this.data.path.id}/steps`),
        this.api.get<LessonOut[]>('/admin/lessons'),
        this.api.get<StoryOut[]>('/admin/stories'),
        this.api.get<QuizQuestionOut[]>('/admin/quiz-questions'),
      ]);
      this.steps.set(steps);
      this.lessons.set(lessons);
      this.stories.set(stories);
      this.questions.set(questions);
      this.resetForm();
    } finally {
      this.loading.set(false);
    }
  }

  resetForm(): void {
    this.form.reset({
      stepType: this.selectedType,
      stepOrder: this.nextOrder(),
      title: '',
      xpReward: 10,
      lessonId: null,
      storyId: null,
      quizCategory: null,
      requiredStepId: null,
    });
    this.syncTypeDefaults();
  }

  syncTypeDefaults(): void {
    const type = this.selectedType;
    const patch: {
      lessonId?: string | null;
      storyId?: string | null;
      quizCategory?: string | null;
    } = {
      lessonId: null,
      storyId: null,
      quizCategory: null,
    };
    if (type === 'lesson') {
      patch.lessonId = this.lessonsForLevel()[0]?.id ?? null;
    } else if (type === 'story') {
      patch.storyId = this.storiesForLevel()[0]?.id ?? null;
    } else if (type === 'quiz') {
      patch.quizCategory = this.availableQuizCategories()[0] ?? null;
    }
    this.form.patchValue(patch);
  }

  setStepType(type: 'lesson' | 'quiz' | 'story'): void {
    this.form.patchValue({ stepType: type });
    this.syncTypeDefaults();
  }

  nextOrder(): number {
    const max = this.steps().reduce((acc, step) => Math.max(acc, step.stepOrder), 0);
    return max + 1;
  }

  missingMessage(): string {
    if (this.selectedType === 'lesson' && this.lessonsForLevel().length === 0) {
      return `Aucune leçon pour ${this.data.path.classLevel}`;
    }
    if (this.selectedType === 'story' && this.storiesForLevel().length === 0) {
      return `Aucune histoire pour ${this.data.path.classLevel}`;
    }
    if (this.selectedType === 'quiz' && this.availableQuizCategories().length === 0) {
      return `Aucune question quiz pour ${this.data.path.classLevel}`;
    }
    return '';
  }

  missingHint(): string {
    if (this.selectedType === 'lesson') return 'Ajoutez une leçon avant de créer cette étape.';
    if (this.selectedType === 'story') return 'Ajoutez une histoire avant de créer cette étape.';
    return 'Ajoutez des questions quiz dans au moins une catégorie avant de créer cette étape.';
  }

  async goToMissingRoute(): Promise<void> {
    const route =
      this.selectedType === 'lesson'
        ? '/lessons'
        : this.selectedType === 'story'
          ? '/stories'
          : '/quiz-questions';
    this.dialogRef.close();
    await this.router.navigateByUrl(route);
  }

  async addStep(): Promise<void> {
    if (this.form.invalid || this.missingMessage()) return;
    this.saving.set(true);
    this.error.set('');
    try {
      const raw = this.form.getRawValue();
      await this.api.post<LearningPathStepOut>(`/admin/learning-paths/${this.data.path.id}/steps`, {
        stepOrder: Number(raw.stepOrder),
        stepType: raw.stepType,
        title: raw.title,
        xpReward: Number(raw.xpReward || 10),
        lessonId: raw.stepType === 'lesson' ? raw.lessonId : null,
        storyId: raw.stepType === 'story' ? raw.storyId : null,
        quizCategory: raw.stepType === 'quiz' ? raw.quizCategory : null,
        requiredStepId: raw.requiredStepId || null,
      });
      const list = await this.api.get<LearningPathStepOut[]>(`/admin/learning-paths/${this.data.path.id}/steps`);
      this.steps.set(list);
      this.resetForm();
    } catch (e: unknown) {
      this.error.set(e instanceof Error ? e.message : 'Impossible d\'ajouter cette étape.');
    } finally {
      this.saving.set(false);
    }
  }

  async confirmDelete(step: LearningPathStepOut): Promise<void> {
    const data: ConfirmDialogData = {
      title: 'Supprimer l\'étape',
      message: `Supprimer « ${step.title} » du parcours ?`,
    };
    const ok = await firstValueFrom(
      this.dialog.open(ConfirmDialogComponent, { data, width: '380px' }).afterClosed(),
    );
    if (!ok) return;
    await this.api.delete(`/admin/learning-paths/${this.data.path.id}/steps/${step.id}`);
    this.steps.set(this.steps().filter((item) => item.id !== step.id));
    this.form.patchValue({ stepOrder: this.nextOrder() });
  }

  stepTypeLabel(type: string): string {
    if (type === 'quiz') return 'Quiz';
    if (type === 'story') return 'Histoire';
    return 'Leçon';
  }

  linkedContentLabel(step: LearningPathStepOut): string {
    if (step.stepType === 'lesson') {
      return this.lessons().find((lesson) => lesson.id === step.lessonId)?.title ?? 'Leçon manquante';
    }
    if (step.stepType === 'story') {
      return this.stories().find((story) => story.id === step.storyId)?.title ?? 'Histoire manquante';
    }
    if (step.stepType === 'quiz') {
      return step.quizCategory ? `Quiz ${step.quizCategory}` : 'Catégorie manquante';
    }
    return '';
  }

  requiredStepLabel(step: LearningPathStepOut): string {
    if (!step.requiredStepId) return '';
    const required = this.steps().find((item) => item.id === step.requiredStepId);
    return required ? `${required.stepOrder} · ${required.title}` : 'Étape manquante';
  }

  quizCount(category: string): number {
    return this.questions().filter(
      (question) => question.level === this.data.path.classLevel && question.category === category,
    ).length;
  }
}
