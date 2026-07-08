import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AdminAuthService } from '../../core/auth/admin-auth.service';
import {
  DIFFICULTY_LABELS,
  resolveDelfTarget,
  STEP_STATUS_LABELS,
} from '../../core/constants/delf-targets';
import { ApiService } from '../../core/http/api.service';
import { DelfTestHistoryOut } from '../../core/models/delf-test.model';
import { ParcoursOut, ParcoursStepOut } from '../../core/models/parcours.model';
import { AdminUserOut } from '../../core/models/user.model';
import { UserProgressItemOut } from '../../core/models/progress.model';

export interface StudentParcoursDialogData {
  user: AdminUserOut;
  progress?: UserProgressItemOut['progress'];
}

@Component({
  selector: 'app-student-parcours-dialog',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './student-parcours.dialog.html',
  styleUrl: './student-parcours.dialog.scss',
})
export class StudentParcoursDialogComponent implements OnInit {
  readonly data = inject<StudentParcoursDialogData>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<StudentParcoursDialogComponent>);
  private readonly api = inject(ApiService);
  private readonly auth = inject(AdminAuthService);

  readonly loading = signal(true);
  readonly parcours = signal<ParcoursOut | null>(null);
  readonly delfTests = signal<DelfTestHistoryOut[]>([]);
  readonly error = signal('');
  activeTab: 'parcours' | 'tests' = 'parcours';

  get delfTarget(): string {
    const p = this.parcours();
    if (p) return p.delfTargetLevel;
    return resolveDelfTarget(this.data.user.classLevel);
  }

  get classLevel(): string {
    return this.parcours()?.classLevel ?? this.data.user.classLevel ?? '—';
  }

  ngOnInit(): void {
    void this.loadParcours();
    void this.loadDelfTests();
  }

  async loadDelfTests(): Promise<void> {
    try {
      let path = '';
      if (this.auth.isProf()) {
        path = `/prof/students/${this.data.user.id}/delf-tests`;
      } else if (this.auth.isSchool()) {
        path = `/school/students/${this.data.user.id}/delf-tests`;
      } else {
        return;
      }
      const items = await this.api.get<DelfTestHistoryOut[]>(path);
      this.delfTests.set(items);
    } catch {
      this.delfTests.set([]);
    }
  }

  async loadParcours(): Promise<void> {
    if (!this.auth.isProf()) {
      this.loading.set(false);
      return;
    }
    try {
      const result = await this.api.get<ParcoursOut>(
        `/prof/students/${this.data.user.id}/parcours`,
      );
      this.parcours.set(result);
    } catch (e: unknown) {
      this.error.set(
        e instanceof Error ? e.message : 'Impossible de charger le parcours',
      );
    } finally {
      this.loading.set(false);
    }
  }

  stepStatusLabel(status: string): string {
    return STEP_STATUS_LABELS[status] ?? status;
  }

  stepTypeIcon(step: ParcoursStepOut): string {
    if (step.stepType === 'quiz') return 'quiz';
    if (step.stepType === 'story') return 'auto_stories';
    return 'menu_book';
  }

  difficultyLabel(value: string): string {
    return DIFFICULTY_LABELS[value] ?? value;
  }

  legacyLessonsCount(): number {
    return this.data.progress?.lessonsCompleted?.length ?? 0;
  }

  legacyQuizCount(): number {
    return Object.keys(this.data.progress?.quizScores ?? {}).length;
  }

  comparisonLabel(value: string | undefined): string {
    if (value === 'above') return 'Au-dessus de l\'objectif';
    if (value === 'below') return 'En dessous de l\'objectif';
    if (value === 'on_track') return 'Conforme';
    return '—';
  }

  categoryKeys(scores: Record<string, number>): string[] {
    return Object.keys(scores ?? {});
  }
}
