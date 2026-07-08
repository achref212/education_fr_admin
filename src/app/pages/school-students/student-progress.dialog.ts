import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

import { UserProgressItemOut } from '../../core/models/progress.model';

const MAX_LESSONS = 20;

@Component({
  selector: 'app-student-progress-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="sp-wrap">
      <div class="sp-header">
        <div class="sp-avatar">
          {{ (data.user.firstName || '?')[0] }}{{ (data.user.lastName || '')[0] || '' }}
        </div>
        <div class="sp-info">
          <h2>{{ data.user.firstName }} {{ data.user.lastName }}</h2>
          <p>{{ data.user.email }}</p>
        </div>
        <button class="sp-close" type="button" (click)="dialogRef.close()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="sp-stats">
        <div class="sp-stat">
          <mat-icon>menu_book</mat-icon>
          <span class="sp-stat-val">{{ lessonsCount }}</span>
          <span class="sp-stat-lbl">Leçons</span>
        </div>
        <div class="sp-stat">
          <mat-icon>quiz</mat-icon>
          <span class="sp-stat-val">{{ quizCount }}</span>
          <span class="sp-stat-lbl">Quiz</span>
        </div>
        <div class="sp-stat">
          <mat-icon>star</mat-icon>
          <span class="sp-stat-val">{{ avgScore !== null ? avgScore + '%' : '—' }}</span>
          <span class="sp-stat-lbl">Score moyen</span>
        </div>
        <div class="sp-stat">
          <mat-icon>trending_up</mat-icon>
          <span class="sp-stat-val">{{ progressPct }}%</span>
          <span class="sp-stat-lbl">Progression</span>
        </div>
      </div>

      <div class="sp-section">
        <h3><mat-icon>school</mat-icon>Informations</h3>
        <div class="sp-grid">
          <div class="sp-field"><span>Niveau</span><strong>{{ data.user.level || '—' }}</strong></div>
          <div class="sp-field"><span>Statut</span><strong>{{ data.user.isActive ? 'Actif' : 'Inactif' }}</strong></div>
          <div class="sp-field"><span>Inscrit le</span><strong>{{ data.user.createdAt | date:'dd/MM/yyyy' }}</strong></div>
        </div>
      </div>

      @if (lessonsCount > 0) {
        <div class="sp-section">
          <h3><mat-icon>check_circle</mat-icon>Leçons complétées ({{ lessonsCount }})</h3>
          <div class="sp-tags">
            @for (id of data.progress.lessonsCompleted; track id) {
              <span class="sp-tag">{{ id }}</span>
            }
          </div>
        </div>
      }

      @if (quizCount > 0) {
        <div class="sp-section">
          <h3><mat-icon>quiz</mat-icon>Scores aux quiz</h3>
          <div class="sp-quiz-list">
            @for (entry of quizEntries; track entry.key) {
              <div class="sp-quiz-row">
                <span class="sp-quiz-name">{{ entry.key }}</span>
                <span class="sp-quiz-score">{{ entry.avg }}%</span>
              </div>
            }
          </div>
        </div>
      }

      <div class="sp-footer">
        <button class="sp-btn" type="button" (click)="dialogRef.close()">
          <mat-icon>done</mat-icon>Fermer
        </button>
      </div>
    </div>
  `,
  styles: [`
    .sp-wrap {
      background: var(--clr-surface);
      border-radius: 20px;
      overflow: hidden;
      max-height: 85vh;
      display: flex;
      flex-direction: column;
    }
    .sp-header {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 20px 22px;
      background: linear-gradient(135deg,#10b981,#06b6d4);
    }
    .sp-avatar {
      width: 52px; height: 52px; border-radius: 14px;
      background: rgba(255,255,255,.2);
      display: flex; align-items: center; justify-content: center;
      font-size: 18px; font-weight: 800; color: white;
      flex-shrink: 0;
    }
    .sp-info {
      flex: 1; min-width: 0;
      h2 { margin: 0 0 4px; font-size: 18px; font-weight: 800; color: white; }
      p { margin: 0; font-size: 13px; color: rgba(255,255,255,.75); overflow: hidden; text-overflow: ellipsis; }
    }
    .sp-close {
      width: 34px; height: 34px; border-radius: 10px; border: none;
      background: rgba(255,255,255,.15); color: white; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      mat-icon { font-size: 18px; }
    }
    .sp-stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1px;
      background: var(--clr-border);
      border-bottom: 1px solid var(--clr-border);
    }
    .sp-stat {
      display: flex; flex-direction: column; align-items: center; gap: 4px;
      padding: 16px 8px;
      background: var(--clr-surface);
      mat-icon { font-size: 20px; width: 20px; height: 20px; color: var(--clr-primary); }
    }
    .sp-stat-val { font-size: 20px; font-weight: 800; color: var(--clr-text); }
    .sp-stat-lbl { font-size: 11px; color: var(--clr-text-muted); text-transform: uppercase; letter-spacing: .05em; }
    .sp-section {
      padding: 18px 22px;
      border-bottom: 1px solid var(--clr-border);
      overflow-y: auto;
      h3 {
        display: flex; align-items: center; gap: 8px;
        margin: 0 0 12px; font-size: 13px; font-weight: 700;
        text-transform: uppercase; letter-spacing: .06em;
        color: var(--clr-text-muted);
        mat-icon { font-size: 16px; width: 16px; height: 16px; }
      }
    }
    .sp-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
    }
    .sp-field {
      span { display: block; font-size: 11px; color: var(--clr-text-muted); margin-bottom: 3px; }
      strong { font-size: 14px; color: var(--clr-text); }
    }
    .sp-tags { display: flex; flex-wrap: wrap; gap: 6px; }
    .sp-tag {
      padding: 4px 10px; border-radius: 8px;
      background: rgba(16,185,129,.1); color: #10b981;
      font-size: 12px; font-weight: 600;
    }
    .sp-quiz-list { display: flex; flex-direction: column; gap: 8px; }
    .sp-quiz-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: 10px 14px; border-radius: 10px;
      background: rgba(99,102,241,.06); border: 1px solid var(--clr-border);
    }
    .sp-quiz-name { font-size: 13px; color: var(--clr-text); }
    .sp-quiz-score { font-size: 14px; font-weight: 800; color: #10b981; }
    .sp-footer {
      padding: 16px 22px;
      display: flex; justify-content: flex-end;
      border-top: 1px solid var(--clr-border);
    }
    .sp-btn {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 10px 22px; border-radius: 12px; border: none;
      background: linear-gradient(135deg,#6366f1,#8b5cf6);
      color: white; font-weight: 700; cursor: pointer;
      mat-icon { font-size: 18px; }
    }
  `],
})
export class StudentProgressDialogComponent {
  readonly data = inject<UserProgressItemOut>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<StudentProgressDialogComponent>);

  get lessonsCount(): number {
    return this.data.progress.lessonsCompleted?.length ?? 0;
  }

  get quizCount(): number {
    return Object.keys(this.data.progress.quizScores ?? {}).length;
  }

  get avgScore(): number | null {
    const allScores: number[] = (Object.values(this.data.progress.quizScores ?? {}) as number[][]).flat();
    if (allScores.length === 0) return null;
    return Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length);
  }

  get progressPct(): number {
    return Math.min(100, Math.round((this.lessonsCount / MAX_LESSONS) * 100));
  }

  get quizEntries(): { key: string; avg: number }[] {
    const scores = this.data.progress.quizScores ?? {};
    return Object.entries(scores).map(([key, vals]) => {
      const arr = vals as number[];
      const avg = arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
      return { key, avg };
    });
  }
}
