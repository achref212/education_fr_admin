import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import {
  DelfMockExamOut,
  DelfMockSection,
  DelfLevelThreshold,
  DelfTestConfigOut,
  DelfTestSessionAdminOut,
  DelfTestTemplateOut,
} from '../../core/models/delf-test.model';
import { AIDelfMockExamOut } from '../../core/models/ai-content.model';
import { QuizQuestionOut } from '../../core/models/quiz.model';
import { ApiService } from '../../core/http/api.service';
import { AssetService } from '../../core/services/asset.service';
import { QUIZ_CATEGORIES, LEVELS } from '../../core/constants/form-options';
import {
  DELF_DEFAULT_THRESHOLDS,
  DELF_LEVELS,
  DELF_LEVEL_GROUPS,
  DELF_TARGETS_BY_CLASS,
  delfGroupsForClass,
  resolveDelfTrack,
} from '../../core/constants/delf-targets';
import { SortableTableDirective } from '../../shared/sortable-table.directive';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../shared/confirm-dialog/confirm-dialog.component';
import { AudioRecorderPickerComponent } from '../../shared/audio-recorder-picker/audio-recorder-picker.component';
import { QuizFormDialogComponent } from '../quiz-questions/quiz-form.dialog';
import { DelfTestDetailDialogComponent } from './delf-test-detail.dialog';

type DelfTab = 'sessions' | 'mockExams' | 'builder' | 'questions' | 'scoring';

const DEFAULT_THRESHOLDS: DelfLevelThreshold[] = DELF_DEFAULT_THRESHOLDS.map((t) => ({ ...t }));

@Component({
  selector: 'app-delf-tests',
  standalone: true,
  imports: [
    SortableTableDirective,
    CommonModule,
    FormsModule,
    DatePipe,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    AudioRecorderPickerComponent,
  ],
  templateUrl: './delf-tests.component.html',
  styleUrl: './delf-tests.component.scss',
})
export class DelfTestsComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly assets = inject(AssetService);
  private readonly dialog = inject(MatDialog);

  readonly categories = QUIZ_CATEGORIES;
  readonly levels = LEVELS;
  readonly delfLevels = DELF_LEVELS;
  readonly delfLevelGroups = DELF_LEVEL_GROUPS;
  readonly tabs: { key: DelfTab; label: string; icon: string }[] = [
    { key: 'sessions', label: 'Sessions', icon: 'assignment' },
    { key: 'mockExams', label: 'Examens blancs', icon: 'library_books' },
    { key: 'builder', label: 'Builder', icon: 'view_module' },
    { key: 'questions', label: 'Questions', icon: 'quiz' },
    { key: 'scoring', label: 'Scoring', icon: 'tune' },
  ];

  readonly activeTab = signal<DelfTab>('sessions');
  readonly loading = signal(true);
  readonly error = signal('');

  readonly sessions = signal<DelfTestSessionAdminOut[]>([]);
  readonly filtered = signal<DelfTestSessionAdminOut[]>([]);
  searchTerm = '';
  statusFilter = '';
  pageSize = 10;
  pageIndex = 0;
  readonly totalPages = computed(() => Math.ceil(this.filtered().length / this.pageSize));

  readonly templates = signal<DelfTestTemplateOut[]>([]);
  readonly mockExams = signal<DelfMockExamOut[]>([]);
  readonly questions = signal<QuizQuestionOut[]>([]);
  readonly filteredQuestions = signal<QuizQuestionOut[]>([]);
  questionSearch = '';
  questionCategory = '';
  questionLevel = '';

  templateId: string | null = null;
  templateName = '';
  templateDescription = '';
  templateClassLevel = LEVELS[0];
  templateTargetLevel = DELF_TARGETS_BY_CLASS[LEVELS[0]] ?? 'A1';
  templateActive = true;
  templateQuestionIds: Record<string, string[]> = this.emptyTemplateQuestions();
  templateSaving = false;
  templateError = '';

  configLoading = false;
  configSaving = false;
  configError = '';
  questionsPerCategory = 5;
  thresholds: DelfLevelThreshold[] = DEFAULT_THRESHOLDS.map((t) => ({ ...t }));

  mockExamId: string | null = null;
  mockTrack: 'Prime' | 'Junior' = 'Prime';
  mockLevel = 'A1.1';
  mockStatus: 'draft' | 'published' | 'archived' = 'draft';
  mockTitle = '';
  mockDescription = '';
  mockSourceNotes = '';
  mockSectionsJson = '';
  mockAssetsJson = '[]';
  mockTrackFilter = '';
  mockLevelFilter = '';
  mockStatusFilter = '';
  mockSaving = false;
  mockGenerating = false;
  mockAudioBusyOrder: number | null = null;
  mockError = '';
  mockSuccess = '';
  mockPreview: DelfMockExamOut | null = null;

  async ngOnInit(): Promise<void> {
    this.startNewMockExam();
    await Promise.all([
      this.reload(),
      this.loadMockExams(),
      this.loadTemplates(),
      this.loadQuestions(),
      this.loadConfig(),
    ]);
    this.loading.set(false);
  }

  setTab(tab: DelfTab): void {
    this.activeTab.set(tab);
  }

  paginated(): DelfTestSessionAdminOut[] {
    return this.filtered().slice(this.pageIndex * this.pageSize, (this.pageIndex + 1) * this.pageSize);
  }

  async reload(): Promise<void> {
    try {
      const params = this.statusFilter ? `?status=${encodeURIComponent(this.statusFilter)}` : '';
      const list = await this.api.get<DelfTestSessionAdminOut[]>(`/admin/delf-tests${params}`);
      this.sessions.set(list);
      this.applyFilter();
    } catch (e: unknown) {
      this.error.set(this.extractError(e, 'Erreur de chargement des sessions DELF.'));
    }
  }

  applyFilter(): void {
    const q = this.searchTerm.toLowerCase();
    this.filtered.set(
      q
        ? this.sessions().filter((s) => {
            const name = `${s.studentFirstName ?? ''} ${s.studentLastName ?? ''}`.toLowerCase();
            return (
              name.includes(q) ||
              (s.studentEmail ?? '').toLowerCase().includes(q) ||
              s.classLevel.toLowerCase().includes(q) ||
              (s.achievedDelfLevel ?? '').toLowerCase().includes(q)
            );
          })
        : [...this.sessions()],
    );
    this.pageIndex = 0;
  }

  setPage(p: number): void {
    this.pageIndex = Math.max(0, Math.min(p, this.totalPages() - 1));
  }

  pages(): number[] {
    return Array.from({ length: this.totalPages() }, (_, i) => i);
  }

  studentName(s: DelfTestSessionAdminOut): string {
    return `${s.studentFirstName ?? ''} ${s.studentLastName ?? ''}`.trim() || '—';
  }

  statusLabel(status: string): string {
    if (status === 'completed') return 'Terminé';
    if (status === 'in_progress') return 'En cours';
    if (status === 'abandoned') return 'Abandonné';
    return status;
  }

  comparisonLabel(value: string | undefined): string {
    if (value === 'above') return 'Au-dessus';
    if (value === 'below') return 'En dessous';
    if (value === 'on_track') return 'Conforme';
    return '—';
  }

  openDetail(session: DelfTestSessionAdminOut): void {
    this.dialog.open(DelfTestDetailDialogComponent, {
      data: { sessionId: session.sessionId },
      panelClass: 'detail-panel',
      width: '860px',
      maxWidth: '96vw',
    });
  }

  async loadTemplates(): Promise<void> {
    try {
      this.templates.set(await this.api.get<DelfTestTemplateOut[]>('/admin/delf-test-templates'));
    } catch (e: unknown) {
      this.templateError = this.extractError(e, 'Erreur de chargement des modèles DELF.');
    }
  }

  async loadMockExams(): Promise<void> {
    try {
      this.mockExams.set(await this.api.get<DelfMockExamOut[]>('/admin/delf-mock-exams'));
    } catch (e: unknown) {
      this.mockError = this.extractError(e, 'Erreur de chargement des examens blancs.');
    }
  }

  mockExamList(): DelfMockExamOut[] {
    return this.mockExams().filter((exam) => {
      if (this.mockTrackFilter && exam.track !== this.mockTrackFilter) return false;
      if (this.mockLevelFilter && exam.level !== this.mockLevelFilter) return false;
      if (this.mockStatusFilter && exam.status !== this.mockStatusFilter) return false;
      return true;
    });
  }

  startNewMockExam(): void {
    this.mockExamId = null;
    this.mockTrack = 'Prime';
    this.mockLevel = 'A1.1';
    this.mockStatus = 'draft';
    this.mockTitle = 'Examen blanc DELF Prime A1.1';
    this.mockDescription = '';
    this.mockSourceNotes = 'Contenu original de préparation. Relecture professeur obligatoire.';
    this.mockSectionsJson = JSON.stringify(this.defaultMockSections(), null, 2);
    this.mockAssetsJson = '[]';
    this.mockPreview = null;
    this.mockError = '';
    this.mockSuccess = '';
  }

  editMockExam(exam: DelfMockExamOut): void {
    this.mockExamId = exam.id;
    this.mockTrack = exam.track;
    this.mockLevel = exam.level;
    this.mockStatus = exam.status;
    this.mockTitle = exam.title;
    this.mockDescription = exam.description ?? '';
    this.mockSourceNotes = exam.sourceNotes ?? '';
    this.mockSectionsJson = JSON.stringify(exam.sections.map(({ id, examId, ...section }) => ({
      ...section,
      items: section.items.map(({ id: _id, sectionId: _sectionId, ...item }) => item),
    })), null, 2);
    this.mockAssetsJson = JSON.stringify(exam.assets.map(({ id, examId, createdAt, ...asset }) => asset), null, 2);
    this.mockPreview = exam;
    this.mockError = '';
    this.mockSuccess = '';
  }

  onMockTrackChange(): void {
    const allowed = this.mockLevelsForTrack();
    if (!allowed.includes(this.mockLevel)) this.mockLevel = allowed[0];
  }

  mockLevelsForTrack(): string[] {
    return this.mockTrack === 'Prime' ? ['A1.1', 'A1', 'A2'] : ['A1', 'A2', 'B1', 'B2'];
  }

  async generateMockExam(): Promise<void> {
    this.mockGenerating = true;
    this.mockError = '';
    this.mockSuccess = '';
    try {
      const result = await this.api.post<AIDelfMockExamOut>('/admin/ai/generate-delf-mock-exam', {
        classLevel: this.classLevelForMock(),
        targetDelfLevel: this.mockLevel,
        count: 3,
        difficulty: 'medium',
        teacherInstructions: `Créer un examen blanc DELF ${this.mockTrack} ${this.mockLevel}, original, relisible par un professeur.`,
      });
      this.mockTrack = result.exam.track;
      this.mockLevel = result.exam.level;
      this.mockStatus = 'draft';
      this.mockTitle = result.exam.title;
      this.mockDescription = result.exam.description ?? '';
      this.mockSourceNotes = result.exam.sourceNotes ?? '';
      this.mockSectionsJson = JSON.stringify(result.exam.sections, null, 2);
      this.mockAssetsJson = JSON.stringify(result.exam.assets, null, 2);
      this.mockPreview = null;
      this.mockSuccess = 'Brouillon généré. Relisez puis enregistrez.';
    } catch (e: unknown) {
      this.mockError = this.extractError(e, 'La génération IA a échoué.');
    } finally {
      this.mockGenerating = false;
    }
  }

  previewMockFromForm(): void {
    try {
      const payload = this.mockPayload();
      this.mockPreview = {
        id: this.mockExamId ?? 'preview',
        track: payload.track,
        level: payload.level,
        title: payload.title,
        description: payload.description,
        status: payload.status,
        totalDurationMinutes: payload.sections.reduce((sum, s) => sum + Number(s.durationMinutes || 0), 0),
        totalPoints: payload.sections.reduce((sum, s) => sum + Number(s.points || 0), 0),
        sourceNotes: payload.sourceNotes,
        sections: payload.sections.map((section) => ({
          ...section,
          id: '',
          examId: '',
          items: section.items.map((item) => ({ ...item, id: '', sectionId: '' })),
        })),
        assets: payload.assets,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.mockError = '';
    } catch (e: unknown) {
      this.mockPreview = null;
      this.mockError = this.extractError(e, 'Structure JSON invalide.');
    }
  }

  async saveMockExam(): Promise<void> {
    let payload;
    try {
      payload = this.mockPayload();
    } catch (e: unknown) {
      this.mockError = this.extractError(e, 'Structure JSON invalide.');
      return;
    }
    this.mockSaving = true;
    this.mockError = '';
    this.mockSuccess = '';
    try {
      if (this.mockExamId) {
        await this.api.put<DelfMockExamOut>(`/admin/delf-mock-exams/${this.mockExamId}`, payload);
      } else {
        await this.api.post<DelfMockExamOut>('/admin/delf-mock-exams', payload);
      }
      await this.loadMockExams();
      this.startNewMockExam();
      this.mockSuccess = 'Examen blanc enregistré.';
    } catch (e: unknown) {
      this.mockError = this.extractError(e, 'Erreur lors de la sauvegarde de l’examen blanc.');
    } finally {
      this.mockSaving = false;
    }
  }

  async archiveMockExam(exam: DelfMockExamOut): Promise<void> {
    const data: ConfirmDialogData = {
      title: 'Archiver l’examen blanc',
      message: `Archiver "${exam.title}" ? Il ne sera plus visible par défaut.`,
    };
    const ok = await firstValueFrom(
      this.dialog.open(ConfirmDialogComponent, { data, width: '380px' }).afterClosed(),
    );
    if (!ok) return;
    await this.api.delete(`/admin/delf-mock-exams/${exam.id}`);
    await this.loadMockExams();
    if (this.mockExamId === exam.id) this.startNewMockExam();
  }

  sectionTypeLabel(type: string): string {
    return {
      listening: 'Compréhension de l’oral',
      reading: 'Compréhension des écrits',
      writing: 'Production écrite',
      speaking: 'Production orale',
    }[type] ?? type;
  }

  mockSectionsForAudio(): DelfMockSection[] {
    try {
      const sections = JSON.parse(this.mockSectionsJson) as DelfMockSection[];
      return sections.filter((section) => section.sectionType === 'listening');
    } catch {
      return [];
    }
  }

  setMockSectionAudioUrl(sectionOrder: number, audioUrl: string): void {
    const sections = JSON.parse(this.mockSectionsJson) as DelfMockSection[];
    this.mockSectionsJson = JSON.stringify(
      sections.map((section) => section.sectionOrder === sectionOrder
        ? { ...section, audioUrl }
        : section),
      null,
      2,
    );
    this.previewMockFromForm();
  }

  setMockAudioBusy(sectionOrder: number, busy: boolean): void {
    this.mockAudioBusyOrder = busy ? sectionOrder : this.mockAudioBusyOrder === sectionOrder ? null : this.mockAudioBusyOrder;
  }

  onMockAudioError(message: string): void {
    if (message) this.mockError = message;
  }

  resolvedUrl(url?: string | null): string {
    return this.assets.resolveUrl(url);
  }

  private mockPayload(): {
    track: 'Prime' | 'Junior';
    level: string;
    title: string;
    description: string | null;
    status: 'draft' | 'published' | 'archived';
    sourceNotes: string | null;
    sections: DelfMockSection[];
    assets: Array<{ assetType: string; title: string; url: string; metadata: Record<string, unknown> }>;
  } {
    const sections = JSON.parse(this.mockSectionsJson) as DelfMockSection[];
    const assets = JSON.parse(this.mockAssetsJson) as Array<{
      assetType: string;
      title: string;
      url: string;
      metadata: Record<string, unknown>;
    }>;
    return {
      track: this.mockTrack,
      level: this.mockLevel,
      title: this.mockTitle.trim(),
      description: this.mockDescription.trim() || null,
      status: this.mockStatus,
      sourceNotes: this.mockSourceNotes.trim() || null,
      sections,
      assets,
    };
  }

  private defaultMockSections(): DelfMockSection[] {
    return [
      this.defaultMockSection(1, 'listening', 'Compréhension de l’oral', 15, [8, 8, 9]),
      this.defaultMockSection(2, 'reading', 'Compréhension des écrits', 15, [8, 7, 10]),
      this.defaultMockSection(3, 'writing', 'Production écrite', 15, [7, 8, 10]),
      this.defaultMockSection(4, 'speaking', 'Production orale', 15, [8, 8, 9]),
    ];
  }

  private defaultMockSection(
    sectionOrder: number,
    sectionType: DelfMockSection['sectionType'],
    title: string,
    durationMinutes: number,
    itemPoints: number[],
  ): DelfMockSection {
    return {
      sectionOrder,
      sectionType,
      title,
      durationMinutes,
      points: 25,
      instructions: `${title}: consignes originales à relire par un professeur.`,
      audioUrl: null,
      rubric: { total: 25 },
      metadata: { source: 'admin_default' },
      items: itemPoints.map((points, index) => ({
        itemOrder: index + 1,
        title: `Exercice ${index + 1}`,
        prompt: 'Remplacer cette consigne par une tâche DELF originale.',
        points,
        content: {},
        answerKey: {},
        rubric: { points },
        metadata: {},
      })),
    };
  }

  private classLevelForMock(): string {
    if (this.mockTrack === 'Prime') {
      return this.mockLevel === 'A1.1' ? '2ème année' : this.mockLevel === 'A1' ? '3ème année' : '5ème année';
    }
    return this.mockLevel === 'A1' ? '7ème année' : this.mockLevel === 'A2' ? '8ème année' : '9ème année';
  }

  startNewTemplate(): void {
    this.templateId = null;
    this.templateName = '';
    this.templateDescription = '';
    this.templateClassLevel = LEVELS[0];
    this.templateTargetLevel = DELF_TARGETS_BY_CLASS[this.templateClassLevel] ?? 'A1';
    this.templateActive = true;
    this.templateQuestionIds = this.emptyTemplateQuestions();
    this.templateError = '';
  }

  editTemplate(template: DelfTestTemplateOut): void {
    this.templateId = template.id;
    this.templateName = template.name;
    this.templateDescription = template.description ?? '';
    this.templateClassLevel = template.classLevel;
    this.templateTargetLevel = template.targetDelfLevel;
    this.templateActive = template.isActive;
    this.templateQuestionIds = this.emptyTemplateQuestions();
    for (const category of this.categories) {
      this.templateQuestionIds[category] = [...(template.questionIdsByCategory[category] ?? [])];
    }
    this.templateError = '';
  }

  onTemplateClassChange(): void {
    this.templateTargetLevel = DELF_TARGETS_BY_CLASS[this.templateClassLevel] ?? 'A1';
  }

  templateDelfGroups() {
    return delfGroupsForClass(this.templateClassLevel);
  }

  templateTrackLabel(): string {
    return resolveDelfTrack(this.templateClassLevel) ?? '—';
  }

  categoryQuestions(category: string): QuizQuestionOut[] {
    return this.questions().filter(
      (q) => q.category === category && q.level === this.templateClassLevel,
    );
  }

  toggleTemplateQuestion(category: string, questionId: string, checked: boolean): void {
    const current = this.templateQuestionIds[category] ?? [];
    this.templateQuestionIds[category] = checked
      ? [...current, questionId]
      : current.filter((id) => id !== questionId);
    this.templateError = '';
  }

  hasTemplateQuestion(category: string, questionId: string): boolean {
    return (this.templateQuestionIds[category] ?? []).includes(questionId);
  }

  templateTotal(): number {
    return this.categories.reduce((sum, category) => sum + (this.templateQuestionIds[category]?.length ?? 0), 0);
  }

  async saveTemplate(): Promise<void> {
    const name = this.templateName.trim();
    if (!name) {
      this.templateError = 'Le nom du modèle est obligatoire.';
      return;
    }
    for (const category of this.categories) {
      if (!this.templateQuestionIds[category]?.length) {
        this.templateError = `Ajoutez au moins une question pour ${category}.`;
        return;
      }
    }
    this.templateSaving = true;
    this.templateError = '';
    const payload = {
      name,
      description: this.templateDescription.trim() || null,
      classLevel: this.templateClassLevel,
      targetDelfLevel: this.templateTargetLevel,
      isActive: this.templateActive,
      questionIdsByCategory: this.templateQuestionIds,
    };
    try {
      if (this.templateId) {
        await this.api.put<DelfTestTemplateOut>(`/admin/delf-test-templates/${this.templateId}`, payload);
      } else {
        await this.api.post<DelfTestTemplateOut>('/admin/delf-test-templates', payload);
      }
      await this.loadTemplates();
      this.startNewTemplate();
    } catch (e: unknown) {
      this.templateError = this.extractError(e, 'Erreur lors de la sauvegarde du modèle.');
    } finally {
      this.templateSaving = false;
    }
  }

  async disableTemplate(template: DelfTestTemplateOut): Promise<void> {
    const data: ConfirmDialogData = {
      title: 'Désactiver le modèle',
      message: `Désactiver "${template.name}" ? Les anciennes sessions restent visibles.`,
    };
    const ok = await firstValueFrom(
      this.dialog.open(ConfirmDialogComponent, { data, width: '380px' }).afterClosed(),
    );
    if (!ok) return;
    await this.api.delete(`/admin/delf-test-templates/${template.id}`);
    await this.loadTemplates();
  }

  async loadQuestions(): Promise<void> {
    try {
      this.questions.set(await this.api.get<QuizQuestionOut[]>('/admin/quiz-questions'));
      this.applyQuestionFilter();
    } catch (e: unknown) {
      this.error.set(this.extractError(e, 'Erreur de chargement des questions.'));
    }
  }

  applyQuestionFilter(): void {
    const q = this.questionSearch.toLowerCase();
    this.filteredQuestions.set(
      this.questions().filter((item) => {
        if (this.questionCategory && item.category !== this.questionCategory) return false;
        if (this.questionLevel && item.level !== this.questionLevel) return false;
        if (!q) return true;
        return item.question.toLowerCase().includes(q) || item.options.join(' ').toLowerCase().includes(q);
      }),
    );
  }

  openCreateQuestion(): void {
    this.dialog.open(QuizFormDialogComponent, { data: { row: null }, panelClass: 'form-dialog-panel' })
      .afterClosed().subscribe((ok) => { if (ok) void this.loadQuestions(); });
  }

  openEditQuestion(row: QuizQuestionOut): void {
    this.dialog.open(QuizFormDialogComponent, { data: { row }, panelClass: 'form-dialog-panel' })
      .afterClosed().subscribe((ok) => { if (ok) void this.loadQuestions(); });
  }

  async deleteQuestion(row: QuizQuestionOut): Promise<void> {
    const data: ConfirmDialogData = { title: 'Supprimer', message: 'Supprimer cette question ?' };
    const ok = await firstValueFrom(
      this.dialog.open(ConfirmDialogComponent, { data, width: '380px' }).afterClosed(),
    );
    if (!ok) return;
    await this.api.delete(`/admin/quiz-questions/${row.id}`);
    await this.loadQuestions();
  }

  async loadConfig(): Promise<void> {
    this.configLoading = true;
    try {
      const config = await this.api.get<DelfTestConfigOut>('/admin/delf-test-config');
      this.questionsPerCategory = config.questionsPerCategory;
      this.thresholds = (config.levelThresholds.length ? config.levelThresholds : DEFAULT_THRESHOLDS)
        .map((t) => ({ level: t.level, minOverall: Number(t.minOverall), minCategory: Number(t.minCategory) }));
    } catch (e: unknown) {
      this.configError = this.extractError(e, 'Erreur de chargement du scoring.');
    } finally {
      this.configLoading = false;
    }
  }

  async saveConfig(): Promise<void> {
    const questionsPerCategory = Number(this.questionsPerCategory);
    if (!Number.isFinite(questionsPerCategory) || questionsPerCategory < 1 || questionsPerCategory > 20) {
      this.configError = 'Le nombre de questions par catégorie doit être entre 1 et 20.';
      return;
    }
    for (const threshold of this.thresholds) {
      if (
        threshold.minOverall < 0 || threshold.minOverall > 100 ||
        threshold.minCategory < 0 || threshold.minCategory > 100
      ) {
        this.configError = 'Les seuils doivent être entre 0 et 100.';
        return;
      }
    }
    this.configSaving = true;
    this.configError = '';
    try {
      const config = await this.api.put<DelfTestConfigOut>('/admin/delf-test-config', {
        questionsPerCategory,
        levelThresholds: this.thresholds,
      });
      this.thresholds = config.levelThresholds.map((t) => ({ ...t }));
    } catch (e: unknown) {
      this.configError = this.extractError(e, 'Erreur lors de la sauvegarde du scoring.');
    } finally {
      this.configSaving = false;
    }
  }

  correctAnswer(q: QuizQuestionOut): string {
    return q.options[q.correctIndex] ?? '—';
  }

  private emptyTemplateQuestions(): Record<string, string[]> {
    return this.categories.reduce<Record<string, string[]>>((acc, category) => {
      acc[category] = [];
      return acc;
    }, {});
  }

  private extractError(e: unknown, fallback: string): string {
    if (e instanceof HttpErrorResponse) {
      const detail = e.error?.detail;
      if (typeof detail === 'string') return detail;
      if (Array.isArray(detail)) {
        return detail.map((item: { msg?: string }) => item.msg ?? '').filter(Boolean).join(' ') || fallback;
      }
    }
    if (e instanceof Error && e.message) return e.message;
    return fallback;
  }
}
