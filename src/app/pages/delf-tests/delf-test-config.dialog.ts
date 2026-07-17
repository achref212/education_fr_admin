import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ApiService } from '../../core/http/api.service';
import { DelfLevelThreshold, DelfTestConfigOut } from '../../core/models/delf-test.model';
import { DELF_DEFAULT_THRESHOLDS } from '../../core/constants/delf-targets';

const DEFAULT_THRESHOLDS: DelfLevelThreshold[] = DELF_DEFAULT_THRESHOLDS.map((t) => ({ ...t }));

@Component({
  selector: 'app-delf-test-config-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './delf-test-config.dialog.html',
  styleUrl: './delf-test-config.dialog.scss',
})
export class DelfTestConfigDialogComponent implements OnInit {
  readonly dialogRef = inject(MatDialogRef<DelfTestConfigDialogComponent>);
  private readonly api = inject(ApiService);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal('');

  questionsPerCategory = 5;
  thresholds: DelfLevelThreshold[] = [];

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      const config = await this.api.get<DelfTestConfigOut>('/admin/delf-test-config');
      this.questionsPerCategory = config.questionsPerCategory;
      this.thresholds = (config.levelThresholds.length
        ? config.levelThresholds
        : DEFAULT_THRESHOLDS
      ).map((t) => ({
        level: t.level,
        minOverall: Number(t.minOverall),
        minCategory: Number(t.minCategory),
      }));
    } catch (e: unknown) {
      this.error.set(this.extractError(e, 'Erreur de chargement de la configuration.'));
      this.thresholds = DEFAULT_THRESHOLDS.map((t) => ({ ...t }));
    } finally {
      this.loading.set(false);
    }
  }

  async save(): Promise<void> {
    const questionsPerCategory = Number(this.questionsPerCategory);
    if (!Number.isFinite(questionsPerCategory) || questionsPerCategory < 1 || questionsPerCategory > 20) {
      this.error.set('Le nombre de questions par catégorie doit être entre 1 et 20.');
      return;
    }

    const levelThresholds: DelfLevelThreshold[] = [];
    for (const t of this.thresholds) {
      const minOverall = Number(t.minOverall);
      const minCategory = Number(t.minCategory);
      if (
        !Number.isFinite(minOverall) ||
        !Number.isFinite(minCategory) ||
        minOverall < 0 ||
        minOverall > 100 ||
        minCategory < 0 ||
        minCategory > 100
      ) {
        this.error.set(`Seuils invalides pour le niveau ${t.level} (valeurs entre 0 et 100).`);
        return;
      }
      levelThresholds.push({
        level: t.level,
        minOverall,
        minCategory,
      });
    }

    this.saving.set(true);
    this.error.set('');
    try {
      await this.api.put('/admin/delf-test-config', {
        questionsPerCategory,
        levelThresholds,
      });
      this.dialogRef.close(true);
    } catch (e: unknown) {
      this.error.set(this.extractError(e, 'Erreur lors de la sauvegarde.'));
    } finally {
      this.saving.set(false);
    }
  }

  private extractError(e: unknown, fallback: string): string {
    if (e instanceof HttpErrorResponse) {
      const detail = e.error?.detail;
      if (typeof detail === 'string') return detail;
      if (Array.isArray(detail)) {
        return detail.map((item: { msg?: string }) => item.msg ?? '').filter(Boolean).join(' ') || fallback;
      }
    }
    if (e instanceof Error && e.message) return e.message;
    return fallback;
  }
}
