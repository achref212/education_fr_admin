import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { UserProgressItemOut } from '../../core/models/progress.model';
import { ApiService } from '../../core/http/api.service';
import { StudentParcoursDialogComponent } from '../../shared/student-parcours/student-parcours.dialog';

const MAX_LESSONS = 20;
const AVATAR_COLORS = [
  'linear-gradient(135deg,#6366f1,#8b5cf6)',
  'linear-gradient(135deg,#10b981,#06b6d4)',
  'linear-gradient(135deg,#ec4899,#f97316)',
  'linear-gradient(135deg,#f59e0b,#ef4444)',
];

@Component({
  selector: 'app-school-students',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatProgressSpinnerModule, MatDialogModule],
  templateUrl: './school-students.component.html',
  styleUrl: './school-students.component.scss',
})
export class SchoolStudentsComponent implements OnInit {
  private readonly api    = inject(ApiService);
  private readonly dialog = inject(MatDialog);

  readonly loading  = signal(true);
  readonly items    = signal<UserProgressItemOut[]>([]);
  readonly filtered = signal<UserProgressItemOut[]>([]);

  searchTerm = '';
  pageSize   = 10;
  pageIndex  = 0;

  readonly paginated  = computed(() =>
    this.filtered().slice(this.pageIndex * this.pageSize, (this.pageIndex + 1) * this.pageSize)
  );
  readonly totalPages = computed(() => Math.ceil(this.filtered().length / this.pageSize));

  async ngOnInit(): Promise<void> {
    await this.reload();
  }

  async reload(): Promise<void> {
    this.loading.set(true);
    try {
      const list = await this.api.get<UserProgressItemOut[]>('/school/progress');
      this.items.set(list);
      this.applyFilter();
    } finally {
      this.loading.set(false);
    }
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

  avatarColor(name: string | undefined): string {
    if (!name) return AVATAR_COLORS[0];
    return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
  }

  openDetail(row: UserProgressItemOut): void {
    this.dialog.open(StudentParcoursDialogComponent, {
      data: { user: row.user, progress: row.progress },
      panelClass: 'detail-panel',
      width: '560px',
      maxWidth: '96vw',
    });
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
