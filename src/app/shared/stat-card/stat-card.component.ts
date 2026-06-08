import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

export interface StatCardConfig {
  gradient: string;   // CSS gradient string
  shadow:   string;   // CSS box-shadow string
  icon:     string;   // Material icon name
}

const CONFIGS: Record<string, StatCardConfig> = {
  'Utilisateurs':         { gradient: 'linear-gradient(135deg,#6366f1,#8b5cf6)', shadow: '0 12px 32px rgba(99,102,241,.35)',  icon: 'people' },
  'Utilisateurs actifs':  { gradient: 'linear-gradient(135deg,#06b6d4,#3b82f6)', shadow: '0 12px 32px rgba(6,182,212,.35)',   icon: 'how_to_reg' },
  'Leçons':               { gradient: 'linear-gradient(135deg,#10b981,#34d399)', shadow: '0 12px 32px rgba(16,185,129,.35)',  icon: 'menu_book' },
  'Questions quiz':       { gradient: 'linear-gradient(135deg,#f59e0b,#fbbf24)', shadow: '0 12px 32px rgba(245,158,11,.35)',  icon: 'quiz' },
  'Histoires':            { gradient: 'linear-gradient(135deg,#ec4899,#f43f5e)', shadow: '0 12px 32px rgba(236,72,153,.35)',  icon: 'auto_stories' },
  'Messages non lus':     { gradient: 'linear-gradient(135deg,#f97316,#fb923c)', shadow: '0 12px 32px rgba(249,115,22,.35)',  icon: 'mail' },
  'Salles multijoueur':   { gradient: 'linear-gradient(135deg,#a855f7,#7c3aed)', shadow: '0 12px 32px rgba(168,85,247,.35)', icon: 'groups' },
};
const DEFAULT_CONFIG: StatCardConfig = {
  gradient: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
  shadow:   '0 12px 32px rgba(99,102,241,.35)',
  icon:     'analytics',
};

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="stat-card" [style.box-shadow]="cfg.shadow">
      <div class="card-glow" [style.background]="cfg.gradient"></div>

      <div class="card-body">
        <div class="icon-badge" [style.background]="cfg.gradient">
          <mat-icon>{{ cfg.icon }}</mat-icon>
        </div>
        <div class="card-info">
          <div class="card-value">{{ displayValue }}</div>
          <div class="card-label">{{ label }}</div>
          @if (hint) {
            <div class="card-hint">{{ hint }}</div>
          }
        </div>
      </div>

      <div class="card-trend">
        <mat-icon class="trend-icon">trending_up</mat-icon>
      </div>
    </div>
  `,
  styles: [`
    .stat-card {
      position: relative;
      background: var(--clr-surface);
      border: 1px solid var(--clr-border);
      border-radius: 20px;
      padding: 24px;
      overflow: hidden;
      transition: transform .25s ease, box-shadow .25s ease;
      cursor: default;
      animation: fadeInUp .5s ease both;

      &:hover {
        transform: translateY(-4px);
        .card-glow { opacity: .12; }
      }
    }

    .card-glow {
      position: absolute; inset: 0;
      opacity: .08;
      pointer-events: none;
      transition: opacity .3s ease;
    }

    .card-body {
      display: flex; align-items: center; gap: 16px;
      position: relative; z-index: 1;
    }

    .icon-badge {
      flex-shrink: 0;
      width: 56px; height: 56px;
      border-radius: 16px;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 6px 16px rgba(0,0,0,.25);

      mat-icon { font-size: 26px; width: 26px; height: 26px; color: white; }
    }

    .card-info { flex: 1; min-width: 0; }

    .card-value {
      font-size: 36px; font-weight: 800; line-height: 1;
      color: var(--clr-text); margin-bottom: 4px;
      animation: count-up .6s ease both;
    }

    .card-label {
      font-size: 13px; font-weight: 500;
      color: var(--clr-text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }

    .card-hint {
      font-size: 11px; color: var(--clr-text-muted); opacity: .6; margin-top: 2px;
    }

    .card-trend {
      position: absolute; bottom: 16px; right: 16px;
      .trend-icon { font-size: 18px; color: var(--clr-border); }
    }
  `],
})
export class StatCardComponent implements OnChanges {
  @Input() label = '';
  @Input() value: number | string = 0;
  @Input() hint  = '';

  cfg: StatCardConfig = DEFAULT_CONFIG;
  displayValue: number | string = 0;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['label']) {
      this.cfg = CONFIGS[this.label] ?? DEFAULT_CONFIG;
    }
    if (changes['value']) {
      this.displayValue = this.value;
    }
  }
}
