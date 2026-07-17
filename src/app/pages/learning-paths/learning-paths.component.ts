import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { LearningPathOut } from '../../core/models/learning-path.model';
import { ApiService } from '../../core/http/api.service';
import { SortableTableDirective } from '../../shared/sortable-table.directive';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../shared/confirm-dialog/confirm-dialog.component';
import { LearningPathFormDialogComponent } from './learning-path-form.dialog';
import { LearningPathStepsDialogComponent } from './learning-path-steps.dialog';

@Component({
  selector: 'app-learning-paths',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatProgressSpinnerModule, MatDialogModule, SortableTableDirective],
  templateUrl: './learning-paths.component.html',
  styleUrl: './learning-paths.component.scss',
})
export class LearningPathsComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly dialog = inject(MatDialog);

  readonly loading = signal(true);
  readonly paths = signal<LearningPathOut[]>([]);
  readonly filtered = signal<LearningPathOut[]>([]);

  searchTerm = '';
  pageSize = 10;
  pageIndex = 0;

  paginated(): LearningPathOut[] {
    return this.filtered().slice(this.pageIndex * this.pageSize, (this.pageIndex + 1) * this.pageSize);
  }
  readonly totalPages = computed(() => Math.ceil(this.filtered().length / this.pageSize));

  async ngOnInit(): Promise<void> {
    await this.reload();
  }

  async reload(): Promise<void> {
    this.loading.set(true);
    try {
      const list = await this.api.get<LearningPathOut[]>('/admin/learning-paths');
      this.paths.set(list);
      this.applyFilter();
    } finally {
      this.loading.set(false);
    }
  }

  applyFilter(): void {
    const q = this.searchTerm.toLowerCase();
    this.filtered.set(
      q
        ? this.paths().filter(
            (p) =>
              p.title.toLowerCase().includes(q) ||
              p.classLevel.toLowerCase().includes(q) ||
              p.delfTargetLevel.toLowerCase().includes(q),
          )
        : [...this.paths()],
    );
    this.pageIndex = 0;
  }

  setPage(p: number): void {
    this.pageIndex = Math.max(0, Math.min(p, this.totalPages() - 1));
  }

  pages(): number[] {
    return Array.from({ length: this.totalPages() }, (_, i) => i);
  }

  openCreate(): void {
    this.dialog
      .open(LearningPathFormDialogComponent, {
        panelClass: 'form-dialog-panel',
        width: '640px',
        maxWidth: '96vw',
      })
      .afterClosed()
      .subscribe((ok) => {
        if (ok) void this.reload();
      });
  }

  openEdit(path: LearningPathOut): void {
    this.dialog
      .open(LearningPathFormDialogComponent, {
        panelClass: 'form-dialog-panel',
        width: '640px',
        maxWidth: '96vw',
        data: { path },
      })
      .afterClosed()
      .subscribe((ok) => {
        if (ok) void this.reload();
      });
  }

  openSteps(path: LearningPathOut): void {
    this.dialog.open(LearningPathStepsDialogComponent, {
      panelClass: 'detail-panel',
      data: { path },
      width: '1040px',
      maxWidth: '96vw',
    });
  }

  scoreRange(path: LearningPathOut): string {
    if (path.minScore == null && path.maxScore == null) return 'Tous scores';
    const min = path.minScore ?? 0;
    const max = path.maxScore ?? 100;
    return `${min}% - ${max}%`;
  }

  openDetail(path: LearningPathOut): void {
    this.openSteps(path);
  }

  async confirmDelete(path: LearningPathOut): Promise<void> {
    const assigned = path.assignedUsersCount || 0;
    const message = assigned > 0
      ? `Supprimer « ${path.title} » ? ${assigned} élève(s) perdront cette affectation et repasseront sur le parcours correspondant à leur test DELF.`
      : `Supprimer « ${path.title} » et toutes ses étapes ?`;
    const data: ConfirmDialogData = {
      title: 'Supprimer le parcours',
      message,
      confirmText: 'Supprimer',
    };
    const ok = await firstValueFrom(
      this.dialog.open(ConfirmDialogComponent, { data, width: '420px' }).afterClosed(),
    );
    if (!ok) return;
    await this.api.delete(`/admin/learning-paths/${path.id}`);
    await this.reload();
  }
}
