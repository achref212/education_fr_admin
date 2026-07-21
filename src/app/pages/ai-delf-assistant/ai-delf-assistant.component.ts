import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';

import {
  AIDelfTestDraft,
  AIDelfTestOut,
  AIContentGenerateIn,
  AILearningPathDraft,
  AILearningPathOut,
  AILessonDraft,
  AILessonOut,
  AIProviderInfo,
  AIQuizQuestionDraft,
  AIQuizQuestionsOut,
} from '../../core/models/ai-content.model';
import { ApiService } from '../../core/http/api.service';
import { DELF_LEVELS, DELF_TARGETS_BY_CLASS } from '../../core/constants/delf-targets';
import { LESSON_CATEGORIES, LEVELS, QUIZ_CATEGORIES } from '../../core/constants/form-options';

type GenerateMode = 'questions' | 'test' | 'lesson' | 'path';
type DraftStatus = 'Brouillon' | 'À corriger' | 'Prêt' | 'Créé';

const TAB_BY_MODE: Record<GenerateMode, number> = {
  questions: 0,
  test: 1,
  lesson: 2,
  path: 3,
};

@Component({
  selector: 'app-ai-delf-assistant',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTabsModule,
  ],
  templateUrl: './ai-delf-assistant.component.html',
  styleUrl: './ai-delf-assistant.component.scss',
})
export class AiDelfAssistantComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);

  readonly levels = LEVELS;
  readonly delfLevels = DELF_LEVELS;
  readonly quizCategories = QUIZ_CATEGORIES;
  readonly lessonCategories = LESSON_CATEGORIES;
  readonly loading = signal<GenerateMode | null>(null);
  readonly saving = signal<string | null>(null);
  readonly error = signal('');
  readonly success = signal('');
  readonly provider = signal<AIProviderInfo | null>(null);
  readonly questions = signal<AIQuizQuestionDraft[]>([]);
  readonly lesson = signal<AILessonDraft | null>(null);
  readonly path = signal<AILearningPathDraft | null>(null);
  readonly test = signal<AIDelfTestDraft | null>(null);

  selectedTabIndex = 0;
  classLevel = LEVELS[1];
  targetDelfLevel = DELF_TARGETS_BY_CLASS[this.classLevel] ?? 'A1';
  quizCategory = QUIZ_CATEGORIES[0];
  lessonCategory = LESSON_CATEGORIES[0];
  count = 4;
  difficulty: 'easy' | 'medium' | 'hard' = 'medium';
  teacherInstructions = '';

  readonly hasDrafts = computed(() =>
    this.questions().length > 0 || !!this.lesson() || !!this.path() || !!this.test(),
  );

  ngOnInit(): void {
    const mode = this.route.snapshot.queryParamMap.get('mode') as GenerateMode | null;
    if (mode && mode in TAB_BY_MODE) this.selectedTabIndex = TAB_BY_MODE[mode];
  }

  syncDelfTarget(): void {
    this.targetDelfLevel = DELF_TARGETS_BY_CLASS[this.classLevel] ?? this.targetDelfLevel;
  }

  async generateQuestions(): Promise<void> {
    await this.generate('questions', '/admin/ai/generate-quiz-questions', this.questionPayload(), (res: AIQuizQuestionsOut) => {
      this.provider.set(res.provider);
      this.questions.set(this.prepareQuestions(res.questions));
    });
  }

  async regenerateQuestion(index: number, category = this.quizCategory): Promise<void> {
    await this.generate('questions', '/admin/ai/generate-quiz-questions', {
      ...this.basePayload(),
      category,
      count: 1,
    }, (res: AIQuizQuestionsOut) => {
      this.provider.set(res.provider);
      const next = [...this.questions()];
      next[index] = this.prepareQuestion(res.questions[0] ?? next[index], category);
      this.questions.set(next);
    });
  }

  async regenerateTestQuestion(category: string, index: number): Promise<void> {
    await this.generate('test', '/admin/ai/generate-quiz-questions', {
      ...this.basePayload(),
      category,
      count: 1,
    }, (res: AIQuizQuestionsOut) => {
      this.provider.set(res.provider);
      const current = this.test();
      if (!current) return;
      const groups = { ...current.questionsByCategory };
      const items = [...(groups[category] ?? [])];
      items[index] = this.prepareQuestion(res.questions[0] ?? items[index], category);
      groups[category] = items;
      this.test.set({ ...current, questionsByCategory: groups });
    });
  }

  async generateTest(): Promise<void> {
    await this.generate('test', '/admin/ai/generate-delf-test', this.basePayload(), (res: AIDelfTestOut) => {
      this.provider.set(res.provider);
      this.test.set({
        ...res.test,
        questionsByCategory: Object.fromEntries(
          Object.entries(res.test.questionsByCategory).map(([category, questions]) => [
            category,
            this.prepareQuestions(questions, category),
          ]),
        ),
      });
    });
  }

  async generateLesson(): Promise<void> {
    await this.generate('lesson', '/admin/ai/generate-lesson', {
      ...this.basePayload(),
      category: this.lessonCategory,
      count: 1,
    }, (res: AILessonOut) => {
      this.provider.set(res.provider);
      this.lesson.set({ ...res.lesson, saved: false });
    });
  }

  async generatePath(): Promise<void> {
    await this.generate('path', '/admin/ai/generate-learning-path', {
      ...this.basePayload(),
      count: 1,
    }, (res: AILearningPathOut) => {
      this.provider.set(res.provider);
      this.path.set({ ...res.path, saved: false });
    });
  }

  async saveQuestion(question: AIQuizQuestionDraft, id: string): Promise<void> {
    const errors = this.questionErrors(question);
    if (errors.length) {
      this.error.set(errors[0]);
      return;
    }
    await this.save(id, '/admin/quiz-questions', this.questionPayloadForSave(question), () => {
      question.saved = true;
      this.questions.set([...this.questions()]);
    });
  }

  async saveReadyQuestions(): Promise<void> {
    const ready = this.questions()
      .map((question, index) => ({ question, index }))
      .filter(({ question }) => !question.saved && this.questionErrors(question).length === 0);
    if (!ready.length) {
      this.error.set('Aucune question valide à créer.');
      return;
    }
    for (const item of ready) {
      await this.saveQuestion(item.question, `q${item.index}`);
    }
  }

  async saveLesson(): Promise<void> {
    const lesson = this.lesson();
    const errors = this.lessonErrors(lesson);
    if (errors.length) {
      this.error.set(errors[0]);
      return;
    }
    await this.save('lesson', '/admin/lessons', lesson, () => this.lesson.set({ ...lesson!, saved: true }));
  }

  async savePath(): Promise<void> {
    const path = this.path();
    const errors = this.pathErrors(path);
    if (errors.length) {
      this.error.set(errors[0]);
      return;
    }
    await this.save('path', '/admin/learning-paths', path, () => this.path.set({ ...path!, saved: true }));
  }

  async saveTestQuestions(): Promise<void> {
    const test = this.test();
    const errors = this.testErrors(test);
    if (!test || errors.length) {
      this.error.set(errors[0] ?? 'Générez un test DELF avant de le créer.');
      return;
    }
    const savedIdsByCategory: Record<string, string[]> = {};
    this.saving.set('test');
    this.error.set('');
    this.success.set('');
    try {
      for (const category of QUIZ_CATEGORIES) {
        savedIdsByCategory[category] = [];
        for (const question of test.questionsByCategory[category]) {
          const saved = await this.api.post<{ id: string }>('/admin/quiz-questions', this.questionPayloadForSave(question, category));
          question.saved = true;
          savedIdsByCategory[category].push(saved.id);
        }
      }
      await this.api.post('/admin/delf-test-templates', {
        name: test.name,
        description: test.description,
        classLevel: test.classLevel,
        targetDelfLevel: test.targetDelfLevel,
        isActive: true,
        questionIdsByCategory: savedIdsByCategory,
      });
      this.test.set({ ...test });
      this.success.set('Test DELF créé avec ses questions.');
    } catch {
      this.error.set('Impossible de créer le test DELF généré.');
    } finally {
      this.saving.set(null);
    }
  }

  statusForQuestion(question: AIQuizQuestionDraft): DraftStatus {
    if (question.saved) return 'Créé';
    return this.questionErrors(question).length ? 'À corriger' : 'Prêt';
  }

  statusForLesson(): DraftStatus {
    const lesson = this.lesson();
    if (!lesson) return 'Brouillon';
    if (lesson.saved) return 'Créé';
    return this.lessonErrors(lesson).length ? 'À corriger' : 'Prêt';
  }

  statusForPath(): DraftStatus {
    const path = this.path();
    if (!path) return 'Brouillon';
    if (path.saved) return 'Créé';
    return this.pathErrors(path).length ? 'À corriger' : 'Prêt';
  }

  testStatus(): DraftStatus {
    const test = this.test();
    if (!test) return 'Brouillon';
    const questions = Object.values(test.questionsByCategory).flat();
    if (questions.length && questions.every(question => question.saved)) return 'Créé';
    return this.testErrors(test).length ? 'À corriger' : 'Prêt';
  }

  questionErrors(question: AIQuizQuestionDraft | null | undefined): string[] {
    if (!question) return ['Question manquante.'];
    const options = question.options.map(option => option.trim()).filter(Boolean);
    const selectedOption = question.options[question.correctIndex]?.trim() ?? '';
    const errors: string[] = [];
    if (!question.question.trim()) errors.push('La question est vide.');
    if (options.length < 2) errors.push('Ajoutez au moins deux options.');
    if (question.correctIndex < 0 || question.correctIndex >= question.options.length || !selectedOption) {
      errors.push('Sélectionnez une bonne réponse valide.');
    }
    if (!question.explanation?.trim()) errors.push('Ajoutez une explication courte.');
    return errors;
  }

  lessonErrors(lesson: AILessonDraft | null | undefined): string[] {
    if (!lesson) return ['Leçon manquante.'];
    const errors: string[] = [];
    if (!lesson.title.trim()) errors.push('Le titre de la leçon est vide.');
    if (!lesson.content.trim()) errors.push('Le contenu de la leçon est vide.');
    if (!LESSON_CATEGORIES.includes(lesson.category)) errors.push('Catégorie de leçon invalide.');
    if (!LEVELS.includes(lesson.level)) errors.push('Niveau scolaire invalide.');
    return errors;
  }

  pathErrors(path: AILearningPathDraft | null | undefined): string[] {
    if (!path) return ['Parcours manquant.'];
    const errors: string[] = [];
    if (!path.title.trim()) errors.push('Le titre du parcours est vide.');
    if (!LEVELS.includes(path.classLevel)) errors.push('Niveau scolaire invalide.');
    if (!DELF_LEVELS.includes(path.delfTargetLevel)) errors.push('Niveau DELF invalide.');
    if (path.minScore !== null && path.maxScore !== null && path.minScore > path.maxScore) {
      errors.push('Le score minimum doit être inférieur au score maximum.');
    }
    return errors;
  }

  testErrors(test: AIDelfTestDraft | null | undefined): string[] {
    if (!test) return ['Test DELF manquant.'];
    const errors: string[] = [];
    if (!test.name.trim()) errors.push('Le nom du test est vide.');
    for (const category of QUIZ_CATEGORIES) {
      const questions = test.questionsByCategory[category] ?? [];
      if (!questions.length) {
        errors.push(`La catégorie ${category} ne contient aucune question.`);
        continue;
      }
      questions.forEach((question, index) => {
        for (const error of this.questionErrors(question)) {
          errors.push(`${category}, question ${index + 1}: ${error}`);
        }
      });
    }
    return errors;
  }

  providerLabel(): string {
    const info = this.provider();
    if (!info) return 'Modèle prêt: Hugging Face principal, NVIDIA en secours';
    return `${info.provider.toUpperCase()} · ${info.model}${info.usedBackup ? ' · secours utilisé' : ''}`;
  }

  statusClass(status: DraftStatus): string {
    if (status === 'Créé') return 'created';
    if (status === 'Prêt') return 'ready';
    if (status === 'À corriger') return 'needs-fix';
    return 'draft';
  }

  testQuestionEntries(): Array<{ category: string; questions: AIQuizQuestionDraft[] }> {
    const test = this.test();
    return QUIZ_CATEGORIES.map(category => ({
      category,
      questions: test?.questionsByCategory[category] ?? [],
    }));
  }

  private questionPayload(): AIContentGenerateIn {
    return {
      ...this.basePayload(),
      category: this.quizCategory,
    };
  }

  private basePayload(): AIContentGenerateIn {
    return {
      classLevel: this.classLevel,
      targetDelfLevel: this.targetDelfLevel,
      count: Math.min(20, Math.max(1, Number(this.count) || 1)),
      difficulty: this.difficulty,
      teacherInstructions: this.teacherInstructions.trim() || null,
    };
  }

  private prepareQuestions(questions: AIQuizQuestionDraft[], fallbackCategory?: string): AIQuizQuestionDraft[] {
    return questions.map(question => this.prepareQuestion(question, fallbackCategory));
  }

  private prepareQuestion(question: AIQuizQuestionDraft, fallbackCategory?: string): AIQuizQuestionDraft {
    return {
      ...question,
      category: fallbackCategory ?? question.category,
      level: question.level || this.classLevel,
      explanation: question.explanation ?? '',
      options: [...question.options],
      saved: false,
    };
  }

  private questionPayloadForSave(question: AIQuizQuestionDraft, category = question.category): unknown {
    const options = question.options.map(option => option.trim()).filter(Boolean);
    const correctIndex = question.options
      .slice(0, question.correctIndex)
      .filter(option => option.trim().length > 0)
      .length;
    return {
      question: question.question.trim(),
      options,
      correctIndex,
      explanation: question.explanation?.trim() || null,
      category,
      level: question.level,
    };
  }

  private async generate<T>(
    mode: GenerateMode,
    endpoint: string,
    payload: AIContentGenerateIn,
    apply: (response: T) => void,
  ): Promise<void> {
    this.loading.set(mode);
    this.error.set('');
    this.success.set('');
    try {
      apply(await this.api.post<T>(endpoint, payload));
    } catch {
      this.error.set('La génération IA a échoué. Vérifiez les clés HF_TOKEN / NVIDIA_API_KEY côté API.');
    } finally {
      this.loading.set(null);
    }
  }

  private async save(id: string, endpoint: string, payload: unknown, done: () => void): Promise<void> {
    this.saving.set(id);
    this.error.set('');
    this.success.set('');
    try {
      await this.api.post(endpoint, payload);
      done();
      this.success.set('Brouillon créé dans le dashboard.');
    } catch {
      this.error.set('Impossible de créer ce brouillon.');
    } finally {
      this.saving.set(null);
    }
  }
}
