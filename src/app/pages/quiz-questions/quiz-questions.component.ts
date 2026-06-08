import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { QuizQuestionOut } from '../../core/models/quiz.model';
import { ApiService } from '../../core/http/api.service';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../shared/confirm-dialog/confirm-dialog.component';
import { QuizFormDialogComponent } from './quiz-form.dialog';
import { DetailDialogComponent, DetailDialogData } from '../../shared/detail-dialog/detail-dialog.component';

const CAT_BADGE: Record<string, string> = {
  Grammaire: 'badge-gram', Conjugaison: 'badge-conj',
  Orthographe: 'badge-orth', Vocabulaire: 'badge-voca',
};

@Component({
  selector: 'app-quiz-questions',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './quiz-questions.component.html',
  styleUrl: './quiz-questions.component.scss',
})
export class QuizQuestionsComponent implements OnInit {
  private readonly api    = inject(ApiService);
  private readonly dialog = inject(MatDialog);

  readonly loading   = signal(true);
  readonly questions = signal<QuizQuestionOut[]>([]);
  readonly filtered  = signal<QuizQuestionOut[]>([]);

  searchTerm = '';
  pageSize   = 10;
  pageIndex  = 0;

  readonly paginated  = computed(() => this.filtered().slice(this.pageIndex * this.pageSize, (this.pageIndex + 1) * this.pageSize));
  readonly totalPages = computed(() => Math.ceil(this.filtered().length / this.pageSize));

  async ngOnInit(): Promise<void> { await this.reload(); }

  async reload(): Promise<void> {
    this.loading.set(true);
    try {
      const list = await this.api.get<QuizQuestionOut[]>('/admin/quiz-questions');
      this.questions.set(list);
      this.applyFilter();
    } finally { this.loading.set(false); }
  }

  applyFilter(): void {
    const q = this.searchTerm.toLowerCase();
    this.filtered.set(q
      ? this.questions().filter(r =>
          r.question.toLowerCase().includes(q) ||
          r.category?.toLowerCase().includes(q) ||
          r.level?.toLowerCase().includes(q))
      : [...this.questions()]);
    this.pageIndex = 0;
  }

  setPage(p: number): void { this.pageIndex = p; }
  pages(): number[] { return Array.from({ length: this.totalPages() }, (_, i) => i); }

  catBadge(cat: string): string { return CAT_BADGE[cat] ?? 'badge-gram'; }

  openDetail(q: QuizQuestionOut): void {
    const data: DetailDialogData = {
      title: q.question.length > 60 ? q.question.slice(0, 60) + '…' : q.question,
      subtitle: q.category,
      icon: 'quiz',
      gradient: 'linear-gradient(135deg,#f59e0b,#fbbf24)',
      fields: [
        { label: 'Question',       value: q.question, type: 'long' },
        { label: 'Catégorie',      value: q.category, type: 'badge', badgeClass: this.catBadge(q.category) },
        { label: 'Niveau',         value: q.level, type: 'code' },
        { label: 'Bonne réponse',  value: q.options[q.correctIndex] },
        { label: 'Choix',          value: q.options, type: 'list' },
        { label: 'Explication',    value: q.explanation, type: 'long' },
      ],
    };
    this.dialog.open(DetailDialogComponent, { data, panelClass: 'detail-panel' });
  }

  openCreate(): void {
    this.dialog.open(QuizFormDialogComponent, { data: { row: null }, panelClass: 'form-dialog-panel' })
      .afterClosed().subscribe(ok => { if (ok) void this.reload(); });
  }

  openEdit(row: QuizQuestionOut): void {
    this.dialog.open(QuizFormDialogComponent, { data: { row }, panelClass: 'form-dialog-panel' })
      .afterClosed().subscribe(ok => { if (ok) void this.reload(); });
  }

  async confirmDelete(row: QuizQuestionOut): Promise<void> {
    const data: ConfirmDialogData = { title: 'Supprimer', message: 'Supprimer cette question ?' };
    const ok = await firstValueFrom(
      this.dialog.open(ConfirmDialogComponent, { data, width: '380px' }).afterClosed()
    );
    if (!ok) return;
    await this.api.delete(`/admin/quiz-questions/${row.id}`);
    await this.reload();
  }
}
