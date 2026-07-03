import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { UserProgressItemOut } from '../../core/models/progress.model';
import { ApiService } from '../../core/http/api.service';
import { DetailDialogComponent, DetailDialogData } from '../../shared/detail-dialog/detail-dialog.component';
import { MatDialog } from '@angular/material/dialog';

const MAX_LESSONS = 20;

@Component({
  selector: 'app-progress',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './progress.component.html',
  styleUrl: './progress.component.scss',
})
export class ProgressComponent implements OnInit {
  private readonly api    = inject(ApiService);
  private readonly dialog = inject(MatDialog);

  readonly loading  = signal(true);
  readonly items    = signal<UserProgressItemOut[]>([]);
  readonly filtered = signal<UserProgressItemOut[]>([]);

  searchTerm = '';
  pageSize   = 10;
  pageIndex  = 0;

  readonly paginated  = computed(() => this.filtered().slice(this.pageIndex * this.pageSize, (this.pageIndex + 1) * this.pageSize));
  readonly totalPages = computed(() => Math.ceil(this.filtered().length / this.pageSize));

  async ngOnInit(): Promise<void> {
    this.loading.set(true);
    try {
      const list = await this.api.get<UserProgressItemOut[]>('/admin/progress');
      this.items.set(list);
      this.applyFilter();
    } finally { this.loading.set(false); }
  }

  applyFilter(): void {
    const q = this.searchTerm.toLowerCase();
    this.filtered.set(q
      ? this.items().filter(r =>
          r.user.email?.toLowerCase().includes(q) ||
          r.user.firstName?.toLowerCase().includes(q) ||
          r.user.lastName?.toLowerCase().includes(q))
      : [...this.items()]);
    this.pageIndex = 0;
  }

  setPage(p: number): void { this.pageIndex = p; }
  pages(): number[] { return Array.from({ length: this.totalPages() }, (_, i) => i); }

  openDetail(row: UserProgressItemOut): void {
    const completed = row.progress.lessonsCompleted ?? [];
    const quizKeys  = Object.keys(row.progress.quizScores ?? {});
    const data: DetailDialogData = {
      title: `${row.user.firstName || ''} ${row.user.lastName || ''}`,
      subtitle: row.user.email,
      icon: 'trending_up',
      gradient: 'linear-gradient(135deg,#10b981,#06b6d4)',
      fields: [
        { label: 'Nom complet',    value: `${row.user.firstName || ''} ${row.user.lastName || ''}` },
        { label: 'E-mail',         value: row.user.email },
        { label: 'Niveau',         value: row.user.level || '-', type: 'code' },
        { label: 'Leçons faites',  value: String(completed.length) },
        { label: 'Quiz faits',     value: String(quizKeys.length) },
        { label: 'Score moyen',    value: this.avgScore(row) !== null ? `${this.avgScore(row)}%` : '—' },
        { label: 'Progression',    value: `${this.progressPct(row)}%` },
        { label: 'Leçons IDs',     value: completed, type: 'list' },
      ],
    };
    this.dialog.open(DetailDialogComponent, { data, panelClass: 'detail-panel' });
  }

  lessonsCount(row: UserProgressItemOut): number {
    return row.progress.lessonsCompleted?.length ?? 0;
  }

  quizCount(row: UserProgressItemOut): number {
    return Object.keys(row.progress.quizScores ?? {}).length;
  }

  avgScore(row: UserProgressItemOut): number | null {
    const allScores: number[] = (Object.values(row.progress.quizScores ?? {}) as number[][]).flat();
    if (allScores.length === 0) return null;
    return Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length);
  }

  progressPct(row: UserProgressItemOut): number {
    return Math.min(100, Math.round((this.lessonsCount(row) / MAX_LESSONS) * 100));
  }
}
