import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { LessonOut } from '../../core/models/lesson.model';
import { ApiService } from '../../core/http/api.service';
import { AdminAuthService } from '../../core/auth/admin-auth.service';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../shared/confirm-dialog/confirm-dialog.component';
import { LessonFormDialogComponent } from './lesson-form.dialog';
import { DetailDialogComponent, DetailDialogData } from '../../shared/detail-dialog/detail-dialog.component';

const CAT_COLORS: Record<string, string> = {
  Grammaire:    'linear-gradient(135deg,#6366f1,#8b5cf6)',
  Conjugaison:  'linear-gradient(135deg,#06b6d4,#0891b2)',
  Orthographe:  'linear-gradient(135deg,#10b981,#34d399)',
  Vocabulaire:  'linear-gradient(135deg,#f59e0b,#fbbf24)',
};
const CAT_BADGE: Record<string, string> = {
  Grammaire:   'badge-gram',
  Conjugaison: 'badge-conj',
  Orthographe: 'badge-orth',
  Vocabulaire: 'badge-voca',
};

@Component({
  selector: 'app-lessons',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './lessons.component.html',
  styleUrl: './lessons.component.scss',
})
export class LessonsComponent implements OnInit {
  private readonly api    = inject(ApiService);
  private readonly auth   = inject(AdminAuthService);
  private readonly dialog = inject(MatDialog);

  readonly loading  = signal(true);
  readonly lessons  = signal<LessonOut[]>([]);
  readonly filtered = signal<LessonOut[]>([]);

  searchTerm = '';
  pageSize   = 10;
  pageIndex  = 0;

  readonly paginated  = computed(() => this.filtered().slice(this.pageIndex * this.pageSize, (this.pageIndex + 1) * this.pageSize));
  readonly totalPages = computed(() => Math.ceil(this.filtered().length / this.pageSize));

  async ngOnInit(): Promise<void> { await this.reload(); }

  get canEdit(): boolean {
    const role = this.auth.user()?.role;
    return role === 'admin' || role === 'prof';
  }

  get canDelete(): boolean {
    const role = this.auth.user()?.role;
    return role === 'admin' || role === 'prof';
  }

  async reload(): Promise<void> {
    this.loading.set(true);
    try {
      const endpoint = this.auth.user()?.role === 'prof' ? '/prof/lessons' : '/admin/lessons';
      const list = await this.api.get<LessonOut[]>(endpoint);
      this.lessons.set(list);
      this.applyFilter();
    } finally {
      this.loading.set(false);
    }
  }

  applyFilter(): void {
    const q = this.searchTerm.toLowerCase();
    this.filtered.set(q
      ? this.lessons().filter(l =>
          l.title.toLowerCase().includes(q) ||
          l.category?.toLowerCase().includes(q) ||
          l.level?.toLowerCase().includes(q))
      : [...this.lessons()]);
    this.pageIndex = 0;
  }

  setPage(p: number): void { this.pageIndex = p; }
  pages(): number[] { return Array.from({ length: this.totalPages() }, (_, i) => i); }

  openDetail(l: LessonOut): void {
    const data: DetailDialogData = {
      title: l.title,
      subtitle: l.category,
      icon: 'menu_book',
      gradient: this.catColor(l.category),
      fields: [
        { label: 'Titre',      value: l.title },
        { label: 'Catégorie',  value: l.category, type: 'badge', badgeClass: this.catBadge(l.category) },
        { label: 'Niveau',     value: l.level, type: 'code' },
        { label: 'Ordre',      value: String(l.sortOrder ?? '—') },
        { label: 'Contenu',    value: l.content, type: 'long' },
      ],
    };
    this.dialog.open(DetailDialogComponent, { data, panelClass: 'detail-panel' });
  }

  catColor(cat: string): string { return CAT_COLORS[cat] ?? 'linear-gradient(135deg,#6366f1,#8b5cf6)'; }
  catBadge(cat: string): string { return CAT_BADGE[cat] ?? 'badge-gram'; }

  openCreate(): void {
    this.dialog.open(LessonFormDialogComponent, { data: { lesson: null }, panelClass: 'form-dialog-panel' })
      .afterClosed().subscribe(ok => { if (ok) void this.reload(); });
  }

  openEdit(row: LessonOut): void {
    this.dialog.open(LessonFormDialogComponent, { data: { lesson: row }, panelClass: 'form-dialog-panel' })
      .afterClosed().subscribe(ok => { if (ok) void this.reload(); });
  }

  async confirmDelete(row: LessonOut): Promise<void> {
    const data: ConfirmDialogData = { title: 'Supprimer la leçon', message: `Supprimer « ${row.title} » ?` };
    const ok = await firstValueFrom(
      this.dialog.open(ConfirmDialogComponent, { data, width: '380px' }).afterClosed()
    );
    if (!ok) return;
    const base = this.auth.isProf() ? '/prof/lessons' : '/admin/lessons';
    await this.api.delete(`${base}/${row.id}`);
    await this.reload();
  }
}
