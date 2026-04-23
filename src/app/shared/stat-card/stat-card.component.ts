import { Component, Input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [MatCardModule],
  template: `
    <mat-card class="card">
      <div class="label">{{ label }}</div>
      <div class="value">{{ value }}</div>
      @if (hint) {
        <div class="hint">{{ hint }}</div>
      }
    </mat-card>
  `,
  styles: [
    `
      .card {
        min-height: 100px;
      }
      .label {
        font-size: 0.85rem;
        color: rgba(0, 0, 0, 0.6);
        margin-bottom: 0.5rem;
      }
      .value {
        font-size: 1.75rem;
        font-weight: 500;
      }
      .hint {
        font-size: 0.75rem;
        margin-top: 0.25rem;
        color: rgba(0, 0, 0, 0.45);
      }
    `,
  ],
})
export class StatCardComponent {
  @Input({ required: true }) label!: string;
  @Input({ required: true }) value!: string | number;
  @Input() hint = '';
}
