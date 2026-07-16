import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { StoryOut } from '../../core/models/story.model';
import { ApiService } from '../../core/http/api.service';
import { SortableTableDirective } from '../../shared/sortable-table.directive';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../shared/confirm-dialog/confirm-dialog.component';
import { StoryFormDialogComponent } from './story-form.dialog';
import { DetailDialogComponent, DetailDialogData } from '../../shared/detail-dialog/detail-dialog.component';

@Component({
  selector: 'app-stories',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatProgressSpinnerModule, SortableTableDirective],
  templateUrl: './stories.component.html',
  styleUrl: './stories.component.scss',
})
export class StoriesComponent implements OnInit {
  private readonly api    = inject(ApiService);
  private readonly dialog = inject(MatDialog);

  readonly loading  = signal(true);
  readonly stories  = signal<StoryOut[]>([]);
  readonly filtered = signal<StoryOut[]>([]);

  searchTerm = '';
  pageSize   = 10;
  pageIndex  = 0;

  paginated(): StoryOut[] { return this.filtered().slice(this.pageIndex * this.pageSize, (this.pageIndex + 1) * this.pageSize); }
  readonly totalPages = computed(() => Math.ceil(this.filtered().length / this.pageSize));

  async ngOnInit(): Promise<void> { await this.reload(); }

  async reload(): Promise<void> {
    this.loading.set(true);
    try {
      const list = await this.api.get<StoryOut[]>('/admin/stories');
      this.stories.set(list);
      this.applyFilter();
    } finally { this.loading.set(false); }
  }

  applyFilter(): void {
    const q = this.searchTerm.toLowerCase();
    this.filtered.set(q
      ? this.stories().filter(s =>
          s.title.toLowerCase().includes(q) ||
          s.level?.toLowerCase().includes(q))
      : [...this.stories()]);
    this.pageIndex = 0;
  }

  setPage(p: number): void { this.pageIndex = Math.max(0, Math.min(p, this.totalPages() - 1)); }
  pages(): number[] { return Array.from({ length: this.totalPages() }, (_, i) => i); }

  openDetail(s: StoryOut): void {
    const data: DetailDialogData = {
      title: s.title,
      subtitle: s.level,
      icon: 'auto_stories',
      gradient: 'linear-gradient(135deg,#ec4899,#f43f5e)',
      fields: [
        { label: 'Titre',   value: s.title },
        { label: 'Niveau',  value: s.level, type: 'code' },
        { label: 'Audio',   value: s.audioUrl ? 'Disponible' : 'Non disponible', type: 'badge',
          badgeClass: s.audioUrl ? 'badge-active' : 'badge-inactive' },
        { label: 'Contenu', value: s.content, type: 'long' },
      ],
    };
    this.dialog.open(DetailDialogComponent, { data, panelClass: 'detail-panel' });
  }

  openCreate(): void {
    this.dialog.open(StoryFormDialogComponent, { data: { row: null }, panelClass: 'form-dialog-panel' })
      .afterClosed().subscribe(ok => { if (ok) void this.reload(); });
  }

  openEdit(row: StoryOut): void {
    this.dialog.open(StoryFormDialogComponent, { data: { row }, panelClass: 'form-dialog-panel' })
      .afterClosed().subscribe(ok => { if (ok) void this.reload(); });
  }

  async confirmDelete(row: StoryOut): Promise<void> {
    const data: ConfirmDialogData = { title: 'Supprimer', message: `Supprimer « ${row.title} » ?` };
    const ok = await firstValueFrom(
      this.dialog.open(ConfirmDialogComponent, { data, width: '380px' }).afterClosed()
    );
    if (!ok) return;
    await this.api.delete(`/admin/stories/${row.id}`);
    await this.reload();
  }
}
