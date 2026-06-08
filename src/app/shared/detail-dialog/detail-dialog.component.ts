import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { trigger, style, animate, transition } from '@angular/animations';

export interface DetailField {
  label: string;
  value: string | number | boolean | string[] | null | undefined;
  type?: 'text' | 'badge' | 'code' | 'long' | 'date' | 'boolean' | 'list';
  badgeClass?: string;
  color?: string;
}

export interface DetailDialogData {
  title: string;
  subtitle?: string;
  icon: string;
  gradient: string;
  fields: DetailField[];
}

@Component({
  selector: 'app-detail-dialog',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatDialogModule],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(40px) scale(.96)' }),
        animate('350ms cubic-bezier(.34,1.56,.64,1)',
          style({ opacity: 1, transform: 'none' })),
      ]),
    ]),
    trigger('fieldIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-12px)' }),
        animate('280ms ease-out', style({ opacity: 1, transform: 'none' })),
      ]),
    ]),
  ],
  template: `
<div class="dd-wrap" @slideIn>
  <!-- header -->
  <div class="dd-header" [style.background]="data.gradient">
    <div class="dd-header-icon">
      <mat-icon>{{ data.icon }}</mat-icon>
    </div>
    <div class="dd-header-text">
      <h2 class="dd-title">{{ data.title }}</h2>
      @if (data.subtitle) {
        <span class="dd-sub">{{ data.subtitle }}</span>
      }
    </div>
    <button class="dd-close" (click)="close()">
      <mat-icon>close</mat-icon>
    </button>
  </div>

  <!-- body -->
  <div class="dd-body">
    @for (field of data.fields; track field.label; let i = $index) {
      @if (field.value !== null && field.value !== undefined && field.value !== '') {
        <div class="dd-field" @fieldIn [style.animation-delay]="(i * 40) + 'ms'">
          <span class="dd-field-label">{{ field.label }}</span>
          <div class="dd-field-value">
            @switch (field.type) {
              @case ('badge') {
                <span class="badge" [ngClass]="field.badgeClass ?? ''" [style.color]="field.color">
                  {{ field.value }}
                </span>
              }
              @case ('code') {
                <code class="dd-code">{{ field.value }}</code>
              }
              @case ('long') {
                <p class="dd-long">{{ field.value }}</p>
              }
              @case ('boolean') {
                <span class="badge" [class.badge-active]="field.value" [class.badge-inactive]="!field.value">
                  {{ field.value ? 'Oui' : 'Non' }}
                </span>
              }
              @case ('list') {
                <div class="dd-list">
                  @for (item of asArray(field.value); track item) {
                    <span class="dd-list-item">{{ item }}</span>
                  }
                </div>
              }
              @default {
                <span class="dd-text">{{ field.value }}</span>
              }
            }
          </div>
        </div>
      }
    }
  </div>

  <!-- footer -->
  <div class="dd-footer">
    <button class="dd-btn-close" (click)="close()">Fermer</button>
  </div>
</div>
  `,
  styles: [`
    .dd-wrap {
      background: var(--clr-surface);
      border-radius: 24px;
      overflow: hidden;
      min-width: 480px;
      max-width: 560px;
    }

    .dd-header {
      display: flex; align-items: center; gap: 14px;
      padding: 24px 24px 20px;
      position: relative;
    }
    .dd-header-icon {
      width: 48px; height: 48px; border-radius: 14px;
      background: rgba(255,255,255,.2);
      display: flex; align-items: center; justify-content: center;
      mat-icon { font-size: 24px; color: white; }
      flex-shrink: 0;
    }
    .dd-header-text { flex: 1; min-width: 0; }
    .dd-title {
      margin: 0 0 2px; font-size: 18px; font-weight: 800;
      color: white; line-height: 1.2;
    }
    .dd-sub { font-size: 13px; color: rgba(255,255,255,.65); display: block; }
    .dd-close {
      width: 34px; height: 34px; border-radius: 10px;
      border: none; background: rgba(255,255,255,.15);
      color: white; cursor: pointer; display: flex;
      align-items: center; justify-content: center;
      transition: background .2s; flex-shrink: 0;
      mat-icon { font-size: 18px; }
      &:hover { background: rgba(255,255,255,.25); }
    }

    .dd-body {
      padding: 20px 24px;
      display: flex; flex-direction: column; gap: 4px;
      max-height: 60vh; overflow-y: auto;
    }
    .dd-field {
      display: flex; align-items: flex-start; gap: 16px;
      padding: 12px 0;
      border-bottom: 1px solid var(--clr-border);
      &:last-child { border-bottom: none; }
    }
    .dd-field-label {
      font-size: 11px; font-weight: 700; text-transform: uppercase;
      letter-spacing: .07em; color: var(--clr-text-muted);
      min-width: 130px; padding-top: 3px; flex-shrink: 0;
    }
    .dd-field-value { flex: 1; min-width: 0; }
    .dd-text { font-size: 14px; color: var(--clr-text); font-weight: 500; }
    .dd-code {
      font-family: 'Courier New', monospace; font-size: 13px;
      background: rgba(99,102,241,.08); padding: 4px 10px; border-radius: 6px;
      color: var(--clr-text-muted); display: inline-block;
    }
    .dd-long {
      margin: 0; font-size: 13px; color: var(--clr-text-muted);
      line-height: 1.65;
    }
    .dd-list {
      display: flex; flex-wrap: wrap; gap: 6px;
    }
    .dd-list-item {
      padding: 3px 10px; border-radius: 99px; font-size: 12px;
      background: rgba(99,102,241,.1); color: var(--clr-primary);
    }

    .dd-footer {
      padding: 16px 24px;
      border-top: 1px solid var(--clr-border);
      display: flex; justify-content: flex-end;
    }
    .dd-btn-close {
      padding: 9px 24px; border-radius: 10px;
      border: 1px solid var(--clr-border);
      background: transparent; color: var(--clr-text-muted);
      font-family: 'Inter', sans-serif; font-size: 14px;
      font-weight: 600; cursor: pointer; transition: all .2s;
      &:hover { background: var(--clr-surface-2); color: var(--clr-text); }
    }

    /* badge imports from global */
    .badge { padding: 4px 10px; border-radius: 99px; font-size: 11px; font-weight: 700; }
    .badge-active   { background: rgba(16,185,129,.15); color: #6ee7b7; }
    .badge-inactive { background: rgba(239,68,68,.15); color: #fca5a5; }
    .badge-admin    { background: rgba(99,102,241,.2);  color: #a78bfa; }
    .badge-user     { background: rgba(6,182,212,.15);  color: #67e8f9; }
  `],
})
export class DetailDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<DetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DetailDialogData,
  ) {}

  close(): void { this.dialogRef.close(); }

  asArray(value: unknown): string[] {
    return Array.isArray(value) ? value.map(String) : [];
  }
}
