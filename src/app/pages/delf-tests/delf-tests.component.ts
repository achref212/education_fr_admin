import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { DelfTestSessionAdminOut } from '../../core/models/delf-test.model';
import { ApiService } from '../../core/http/api.service';
import { DelfTestConfigDialogComponent } from './delf-test-config.dialog';
import { DelfTestDetailDialogComponent } from './delf-test-detail.dialog';

@Component({
  selector: 'app-delf-tests',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DatePipe,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule,
  ],
  templateUrl: './delf-tests.component.html',
  styleUrl: './delf-tests.component.scss',
})
export class DelfTestsComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly dialog = inject(MatDialog);

  readonly loading = signal(true);
  readonly sessions = signal<DelfTestSessionAdminOut[]>([]);
  readonly filtered = signal<DelfTestSessionAdminOut[]>([]);

  searchTerm = '';
  statusFilter = '';
  pageSize = 10;
  pageIndex = 0;

  readonly paginated = computed(() =>
    this.filtered().slice(this.pageIndex * this.pageSize, (this.pageIndex + 1) * this.pageSize),
  );
  readonly totalPages = computed(() => Math.ceil(this.filtered().length / this.pageSize));

  async ngOnInit(): Promise<void> {
    await this.reload();
  }

  async reload(): Promise<void> {
    this.loading.set(true);
    try {
      const params = this.statusFilter ? `?status=${encodeURIComponent(this.statusFilter)}` : '';
      const list = await this.api.get<DelfTestSessionAdminOut[]>(`/admin/delf-tests${params}`);
      this.sessions.set(list);
      this.applyFilter();
    } finally {
      this.loading.set(false);
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
    this.pageIndex = p;
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
      width: '640px',
      maxWidth: '96vw',
    });
  }

  openConfig(): void {
    this.dialog
      .open(DelfTestConfigDialogComponent, {
        panelClass: 'form-dialog-panel',
        width: '560px',
        maxWidth: '96vw',
      })
      .afterClosed()
      .subscribe((ok) => {
        if (ok) void this.reload();
      });
  }
}
