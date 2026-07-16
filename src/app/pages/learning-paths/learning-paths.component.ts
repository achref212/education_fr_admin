import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { LEVELS } from '../../core/constants/form-options';
import { LearningPathOut } from '../../core/models/learning-path.model';
import { ApiService } from '../../core/http/api.service';
import { SortableTableDirective } from '../../shared/sortable-table.directive';
import { DetailDialogComponent, DetailDialogData } from '../../shared/detail-dialog/detail-dialog.component';
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
    const existingClassLevels = this.paths().map((p) => p.classLevel);
    this.dialog
      .open(LearningPathFormDialogComponent, {
        panelClass: 'form-dialog-panel',
        width: '560px',
        maxWidth: '96vw',
        data: { existingClassLevels },
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
        width: '560px',
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
      width: '640px',
      maxWidth: '96vw',
    });
  }

  openDetail(path: LearningPathOut): void {
    const data: DetailDialogData = {
      title: path.title,
      subtitle: path.classLevel,
      icon: 'route',
      gradient: 'linear-gradient(135deg,#6366f1,#06b6d4)',
      fields: [
        { label: 'Niveau scolaire', value: path.classLevel },
        { label: 'Objectif DELF', value: path.delfTargetLevel, type: 'badge', badgeClass: 'badge-active' },
        { label: 'Description', value: path.description ?? '—', type: 'long' },
        { label: 'Statut', value: path.isActive ? 'Actif' : 'Inactif', type: 'badge',
          badgeClass: path.isActive ? 'badge-active' : 'badge-inactive' },
        { label: 'Créé le', value: new Date(path.createdAt).toLocaleDateString('fr-FR') },
      ],
    };
    this.dialog.open(DetailDialogComponent, { data, panelClass: 'detail-panel' });
  }
}
