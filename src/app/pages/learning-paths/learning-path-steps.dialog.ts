import { Component, Inject, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { STEP_STATUS_LABELS } from '../../core/constants/delf-targets';
import { LearningPathOut, LearningPathStepOut } from '../../core/models/learning-path.model';
import { ApiService } from '../../core/http/api.service';

export interface LearningPathStepsData {
  path: LearningPathOut;
}

@Component({
  selector: 'app-learning-path-steps-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="steps-wrap">
      <div class="steps-header">
        <div>
          <h2>{{ data.path.title }}</h2>
          <p>{{ data.path.classLevel }} · DELF {{ data.path.delfTargetLevel }}</p>
        </div>
        <button type="button" class="steps-close" (click)="dialogRef.close()"><mat-icon>close</mat-icon></button>
      </div>
      @if (loading()) {
        <div class="steps-loading"><mat-spinner diameter="28" /><span>Chargement…</span></div>
      } @else if (steps().length === 0) {
        <p class="steps-empty">Aucune étape définie pour ce parcours.</p>
      } @else {
        <div class="steps-list">
          @for (step of steps(); track step.id) {
            <div class="steps-item">
              <span class="steps-order">{{ step.stepOrder }}</span>
              <div class="steps-body">
                <strong>{{ step.title }}</strong>
                <span>{{ step.stepType }} · +{{ step.xpReward }} XP</span>
              </div>
            </div>
          }
        </div>
      }
      <div class="steps-footer">
        <button type="button" class="steps-btn" (click)="dialogRef.close()">Fermer</button>
      </div>
    </div>
  `,
  styles: [`
    .steps-wrap { background: var(--clr-surface); border-radius: 20px; overflow: hidden; color: var(--clr-text); }
    .steps-header {
      display: flex; justify-content: space-between; align-items: flex-start;
      padding: 20px 22px; background: linear-gradient(135deg,#6366f1,#06b6d4); color: white;
      h2 { margin: 0 0 4px; font-size: 18px; }
      p { margin: 0; font-size: 13px; opacity: 0.85; }
    }
    .steps-close {
      width: 34px; height: 34px; border: none; border-radius: 10px;
      background: rgba(255,255,255,.15); color: white; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
    }
    .steps-loading, .steps-empty { padding: 32px 22px; color: var(--clr-text-muted); text-align: center; }
    .steps-loading { display: flex; align-items: center; justify-content: center; gap: 12px; }
    .steps-list { padding: 16px 22px; max-height: 420px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; }
    .steps-item {
      display: flex; align-items: center; gap: 12px; padding: 12px 14px;
      border-radius: 12px; border: 1px solid var(--clr-border); background: var(--clr-surface-2);
    }
    .steps-order {
      width: 28px; height: 28px; border-radius: 8px; background: rgba(99,102,241,.12);
      color: var(--clr-primary); font-weight: 800; font-size: 12px;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .steps-body {
      display: flex; flex-direction: column; gap: 2px;
      strong { font-size: 14px; color: var(--clr-text); }
      span { font-size: 12px; color: var(--clr-text-muted); }
    }
    .steps-footer { padding: 16px 22px; border-top: 1px solid var(--clr-border); display: flex; justify-content: flex-end; }
    .steps-btn {
      padding: 10px 20px; border: none; border-radius: 12px;
      background: linear-gradient(135deg,#6366f1,#8b5cf6); color: white; font-weight: 700; cursor: pointer;
    }
  `],
})
export class LearningPathStepsDialogComponent implements OnInit {
  readonly data = inject<LearningPathStepsData>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<LearningPathStepsDialogComponent>);
  private readonly api = inject(ApiService);

  readonly loading = signal(true);
  readonly steps = signal<LearningPathStepOut[]>([]);

  ngOnInit(): void {
    void this.loadSteps();
  }

  async loadSteps(): Promise<void> {
    try {
      const list = await this.api.get<LearningPathStepOut[]>(
        `/admin/learning-paths/${this.data.path.id}/steps`,
      );
      this.steps.set(list);
    } finally {
      this.loading.set(false);
    }
  }
}
