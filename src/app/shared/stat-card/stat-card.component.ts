import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  signal,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [MatIconModule, NgTemplateOutlet, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-template #cardContent>
      <div class="stat-card__topline">
        <span class="stat-card__eyebrow">{{ label }}</span>
        @if (status) {
          <span class="stat-card__status">{{ status }}</span>
        }
      </div>
      <div class="stat-card__body">
        <div class="stat-card__icon" aria-hidden="true">
          <mat-icon>{{ icon }}</mat-icon>
        </div>
        <div class="stat-card__copy">
          <strong class="stat-card__value">{{ displayValue() }}</strong>
          @if (detail || hint) {
            <span class="stat-card__detail">{{ detail || hint }}</span>
          }
        </div>
      </div>
      @if (route) {
        <span class="stat-card__arrow" aria-hidden="true">
          <mat-icon>arrow_forward</mat-icon>
        </span>
      }
    </ng-template>

    @if (route) {
      <a
        class="stat-card stat-card--link"
        [routerLink]="route"
        [style.--stat-accent]="accent"
        [style.animation-delay]="animationDelay"
        [attr.aria-label]="label + ' : ' + value"
      >
        <ng-container [ngTemplateOutlet]="cardContent" />
      </a>
    } @else {
      <div
        class="stat-card"
        [style.--stat-accent]="accent"
        [style.animation-delay]="animationDelay"
      >
        <ng-container [ngTemplateOutlet]="cardContent" />
      </div>
    }
  `,
  styles: [`
    :host { display: block; min-width: 0; }

    .stat-card {
      position: relative;
      display: block;
      min-height: 166px;
      padding: 20px;
      overflow: hidden;
      color: var(--clr-text);
      text-decoration: none;
      background:
        radial-gradient(circle at 100% 0, color-mix(in srgb, var(--stat-accent) 17%, transparent), transparent 46%),
        var(--clr-surface);
      border: 1px solid var(--clr-border);
      border-radius: var(--radius);
      box-shadow: var(--shadow-card);
      animation: fadeInUp .55s cubic-bezier(.2,.8,.2,1) both;
      transition: transform .25s ease, border-color .25s ease, box-shadow .25s ease;
    }

    .stat-card::after {
      position: absolute;
      right: -24px;
      bottom: -34px;
      width: 110px;
      height: 110px;
      content: '';
      border: 18px solid color-mix(in srgb, var(--stat-accent) 8%, transparent);
      border-radius: 50%;
      pointer-events: none;
    }

    .stat-card--link:hover {
      transform: translateY(-4px);
      border-color: color-mix(in srgb, var(--stat-accent) 38%, var(--clr-border));
      box-shadow: 0 20px 46px color-mix(in srgb, var(--stat-accent) 13%, transparent);
    }

    .stat-card__topline,
    .stat-card__body {
      position: relative;
      z-index: 1;
      display: flex;
      align-items: center;
    }

    .stat-card__topline {
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 20px;
    }

    .stat-card__eyebrow {
      min-width: 0;
      overflow: hidden;
      color: var(--clr-text-muted);
      font-size: 13px;
      font-weight: 700;
      letter-spacing: .04em;
      text-overflow: ellipsis;
      text-transform: uppercase;
      white-space: nowrap;
    }

    .stat-card__status {
      flex: 0 0 auto;
      padding: 4px 8px;
      color: var(--stat-accent);
      font-size: 10px;
      font-weight: 800;
      background: color-mix(in srgb, var(--stat-accent) 12%, transparent);
      border: 1px solid color-mix(in srgb, var(--stat-accent) 22%, transparent);
      border-radius: 999px;
    }

    .stat-card__body { gap: 14px; }

    .stat-card__icon {
      display: grid;
      flex: 0 0 auto;
      width: 50px;
      height: 50px;
      color: #fff;
      background: var(--stat-accent);
      border-radius: 15px;
      box-shadow: 0 10px 24px color-mix(in srgb, var(--stat-accent) 28%, transparent);
      place-items: center;

      mat-icon { width: 24px; height: 24px; font-size: 24px; }
    }

    .stat-card__copy {
      display: flex;
      min-width: 0;
      flex-direction: column;
      gap: 5px;
    }

    .stat-card__value {
      color: var(--clr-text);
      font-size: clamp(28px, 3vw, 38px);
      font-weight: 800;
      letter-spacing: -.04em;
      line-height: 1;
    }

    .stat-card__detail {
      overflow: hidden;
      color: var(--clr-text-muted);
      font-size: 13px;
      line-height: 1.4;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .stat-card__arrow {
      position: absolute;
      right: 18px;
      bottom: 18px;
      z-index: 1;
      display: grid;
      width: 28px;
      height: 28px;
      color: var(--stat-accent);
      background: color-mix(in srgb, var(--stat-accent) 10%, transparent);
      border-radius: 50%;
      transition: transform .22s ease;
      place-items: center;

      mat-icon { width: 16px; height: 16px; font-size: 16px; }
    }

    .stat-card--link:hover .stat-card__arrow { transform: translateX(3px); }
  `],
})
export class StatCardComponent implements OnChanges, OnDestroy {
  @Input() label = '';
  @Input() value: number | string = 0;
  @Input() hint = '';
  @Input() detail = '';
  @Input() icon = 'analytics';
  @Input() accent = '#6d5dfc';
  @Input() status = '';
  @Input() route = '';
  @Input() order = 0;

  readonly displayValue = signal<number | string>(0);
  private animationFrame?: number;

  get animationDelay(): string {
    return `${Math.max(0, this.order) * 70}ms`;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['value']) {
      this.animateValue(this.value);
    }
  }

  ngOnDestroy(): void {
    if (this.animationFrame !== undefined) {
      cancelAnimationFrame(this.animationFrame);
    }
  }

  private animateValue(value: number | string): void {
    if (typeof value !== 'number' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.displayValue.set(value);
      return;
    }

    if (this.animationFrame !== undefined) {
      cancelAnimationFrame(this.animationFrame);
    }

    const currentValue = this.displayValue();
    const startValue = typeof currentValue === 'number' ? currentValue : 0;
    const difference = value - startValue;
    const duration = 650;
    let startTime: number | undefined;

    const tick = (time: number): void => {
      startTime ??= time;
      const progress = Math.min((time - startTime) / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      this.displayValue.set(Math.round(startValue + difference * easedProgress));

      if (progress < 1) {
        this.animationFrame = requestAnimationFrame(tick);
      } else {
        this.displayValue.set(value);
        this.animationFrame = undefined;
      }
    };

    this.animationFrame = requestAnimationFrame(tick);
  }
}
