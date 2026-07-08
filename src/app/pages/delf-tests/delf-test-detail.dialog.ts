import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ApiService } from '../../core/http/api.service';
import { DelfTestResultsOut } from '../../core/models/delf-test.model';

export interface DelfTestDetailDialogData {
  sessionId: string;
}

@Component({
  selector: 'app-delf-test-detail-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './delf-test-detail.dialog.html',
  styleUrl: './delf-test-detail.dialog.scss',
})
export class DelfTestDetailDialogComponent implements OnInit {
  readonly data = inject<DelfTestDetailDialogData>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<DelfTestDetailDialogComponent>);
  private readonly api = inject(ApiService);

  readonly loading = signal(true);
  readonly result = signal<DelfTestResultsOut | null>(null);
  readonly error = signal('');

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    try {
      const detail = await this.api.get<DelfTestResultsOut>(
        `/admin/delf-tests/${this.data.sessionId}`,
      );
      this.result.set(detail);
    } catch (e: unknown) {
      this.error.set(e instanceof Error ? e.message : 'Erreur de chargement');
    } finally {
      this.loading.set(false);
    }
  }

  comparisonLabel(value: string | undefined): string {
    if (value === 'above') return 'Au-dessus de l\'objectif';
    if (value === 'below') return 'En dessous de l\'objectif';
    if (value === 'on_track') return 'Conforme à l\'objectif';
    return '—';
  }

  categoryKeys(scores: Record<string, number>): string[] {
    return Object.keys(scores);
  }
}
