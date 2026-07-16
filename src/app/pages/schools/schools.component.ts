import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe, SlicePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { SchoolOut } from '../../core/models/user.model';
import { ApiService } from '../../core/http/api.service';
import { SortableTableDirective } from '../../shared/sortable-table.directive';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../shared/confirm-dialog/confirm-dialog.component';
import { SchoolCreateDialogComponent } from './school-create.dialog';
import { SchoolDetailDialogComponent } from './school-detail.dialog';

@Component({
  selector: 'app-schools',
  standalone: true,
  imports: [
    SortableTableDirective,
    CommonModule, FormsModule, DatePipe, SlicePipe,
    MatIconModule, MatProgressSpinnerModule, MatDialogModule,
  ],
  templateUrl: './schools.component.html',
  styleUrl: './schools.component.scss',
})
export class SchoolsComponent implements OnInit {
  private readonly api    = inject(ApiService);
  private readonly dialog = inject(MatDialog);

  readonly loading  = signal(true);
  readonly schools  = signal<SchoolOut[]>([]);
  readonly filtered = signal<SchoolOut[]>([]);

  searchTerm = '';
  pageSize   = 10;
  pageIndex  = 0;

  paginated(): SchoolOut[] {
    return this.filtered().slice(this.pageIndex * this.pageSize, (this.pageIndex + 1) * this.pageSize);
  }
  readonly totalPages = computed(() =>
    Math.ceil(this.filtered().length / this.pageSize)
  );

  async ngOnInit(): Promise<void> { await this.reload(); }

  async reload(): Promise<void> {
    this.loading.set(true);
    try {
      const list = await this.api.get<SchoolOut[]>('/admin/schools');
      this.schools.set(list);
      this.applyFilter();
    } finally {
      this.loading.set(false);
    }
  }

  applyFilter(): void {
    const q = this.searchTerm.toLowerCase();
    this.filtered.set(
      q
        ? this.schools().filter(s =>
            s.name.toLowerCase().includes(q) ||
            s.email.toLowerCase().includes(q) ||
            (s.city || '').toLowerCase().includes(q)
          )
        : [...this.schools()]
    );
    this.pageIndex = 0;
  }

  setPage(p: number): void { this.pageIndex = Math.max(0, Math.min(p, this.totalPages() - 1)); }
  pages(): number[] { return Array.from({ length: this.totalPages() }, (_, i) => i); }

  avatarLetter(s: SchoolOut): string {
    return s.name.charAt(0).toUpperCase();
  }

  openCreate(): void {
    this.dialog.open(SchoolCreateDialogComponent, { panelClass: 'form-dialog-panel', width: '520px' })
      .afterClosed().subscribe(ok => { if (ok) void this.reload(); });
  }

  openDetail(s: SchoolOut): void {
    this.dialog.open(SchoolDetailDialogComponent, {
      panelClass: 'form-dialog-panel',
      width: '560px',
      data: { school: s },
    }).afterClosed().subscribe(ok => { if (ok) void this.reload(); });
  }

  async confirmDelete(school: SchoolOut): Promise<void> {
    const data: ConfirmDialogData = {
      title: 'Supprimer l\'établissement',
      message: `Supprimer définitivement « ${school.name} » ? Cette action est irréversible.`,
    };
    const ok = await firstValueFrom(
      this.dialog.open(ConfirmDialogComponent, { data, width: '400px' }).afterClosed()
    );
    if (!ok) return;
    await this.api.delete(`/admin/schools/${school.id}`);
    await this.reload();
  }
}
