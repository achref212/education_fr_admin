import {
  Component, forwardRef, HostBinding, Input, OnDestroy, OnInit, signal,
} from '@angular/core';
import {
  ControlValueAccessor,
  FormControl, FormGroup, FormsModule,
  NG_VALUE_ACCESSOR, ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { Subscription } from 'rxjs';

import { PHONE_CODES, PhoneCode, parsePhone } from '../phone-codes';

// ────────────────────────────────────────────────────────────────────────────
// Value emitted by this component is a combined string, e.g. "+216 12 345 678"
// or '' when both parts are empty.
// ────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-phone-input',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    MatFormFieldModule, MatSelectModule, MatInputModule, MatIconModule,
  ],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => PhoneInputComponent), multi: true },
  ],
  template: `
    <div class="pi-wrap" [class.pi-disabled]="isDisabled">

      <!-- ── Country code selector ──────────────────────────────── -->
      <mat-form-field appearance="outline" class="pi-code-field" subscriptSizing="dynamic">
        <mat-label>Pays</mat-label>

        <mat-select
          [formControl]="codeCtrl"
          panelClass="phone-panel"
          disableOptionCentering
          (openedChange)="onPanelToggle($event)">

          <!-- Custom trigger: flag + code -->
          <mat-select-trigger>
            <span class="pi-trigger">
              <span class="pi-flag">{{ selectedEntry()?.flag ?? '' }}</span>
              <span class="pi-dial">{{ codeCtrl.value }}</span>
            </span>
          </mat-select-trigger>

          <!-- Sticky search inside panel -->
          <div class="pi-search-row" (click)="$event.stopPropagation()">
            <mat-icon class="pi-search-icon">search</mat-icon>
            <input
              class="pi-search-input"
              [placeholder]="'Pays ou indicatif…'"
              [(ngModel)]="searchQ"
              [ngModelOptions]="{standalone: true}"
              (keydown)="$event.stopPropagation()"
            />
            @if (searchQ) {
              <mat-icon class="pi-search-clear"
                        (click)="searchQ = ''; $event.stopPropagation()">close</mat-icon>
            }
          </div>

          <!-- Options -->
          @for (pc of filteredCodes(); track pc.dialCode) {
            <mat-option [value]="pc.dialCode" class="pi-option">
              <span class="pi-opt-flag">{{ pc.flag }}</span>
              <span class="pi-opt-code">{{ pc.dialCode }}</span>
              <span class="pi-opt-country">{{ pc.country }}</span>
            </mat-option>
          }
        </mat-select>
      </mat-form-field>

      <!-- ── National number ──────────────────────────────────────── -->
      <mat-form-field appearance="outline" class="pi-number-field" subscriptSizing="dynamic">
        <mat-label>Numéro</mat-label>
        <input matInput [formControl]="numberCtrl" type="tel" [placeholder]="placeholder" />
      </mat-form-field>
    </div>
  `,
  styles: [`
    /* ── Layout ─────────────────────────────────────────────────── */
    .pi-wrap {
      display: flex;
      gap: 8px;
      align-items: flex-start;
      width: 100%;
    }
    .pi-wrap.pi-disabled { opacity: .5; pointer-events: none; }

    .pi-code-field   { width: 110px; flex-shrink: 0; min-width: 0; }
    .pi-number-field { flex: 1; min-width: 0; overflow: hidden; }

    /* ── Trigger display ─────────────────────────────────────────── */
    .pi-trigger {
      display: flex;
      align-items: center;
      gap: 5px;
      white-space: nowrap;
      overflow: hidden;
      width: 100%;
      min-width: 0;
    }
    .pi-flag { font-size: 20px; line-height: 1; flex-shrink: 0; }
    .pi-dial {
      font-size: 13px;
      font-weight: 700;
      color: var(--clr-text, #e2e8f0);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex: 1;
      min-width: 0;
      display: inline-block;
      max-width: 100%;
    }

    /* ── Search row inside panel ─────────────────────────────────── */
    /* (panel itself is styled globally in styles.scss) */
    .pi-search-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px 8px;
      position: sticky;
      top: 0;
      z-index: 10;
      background: var(--clr-surface, #1a1a2e);
      border-bottom: 1px solid rgba(255,255,255,.06);
    }
    .pi-search-icon {
      font-size: 18px; width: 18px; height: 18px;
      color: rgba(255,255,255,.35);
      flex-shrink: 0;
    }
    .pi-search-input {
      flex: 1;
      background: transparent;
      border: none;
      outline: none;
      font-size: 13px;
      color: var(--clr-text, #e2e8f0);
      font-family: inherit;
      &::placeholder { color: rgba(255,255,255,.28); }
    }
    .pi-search-clear {
      font-size: 16px; width: 16px; height: 16px;
      color: rgba(255,255,255,.3);
      cursor: pointer;
      flex-shrink: 0;
      &:hover { color: rgba(255,255,255,.6); }
    }

    /* ── Options ─────────────────────────────────────────────────── */
    .pi-opt-flag    { font-size: 20px; margin-right: 8px; }
    .pi-opt-code    { font-size: 12px; font-weight: 700; min-width: 40px; color: var(--clr-primary, #6366f1); }
    .pi-opt-country { font-size: 12px; color: var(--clr-text-muted, rgba(255,255,255,.55)); overflow: hidden; text-overflow: ellipsis; }
  `],
})
export class PhoneInputComponent implements ControlValueAccessor, OnInit, OnDestroy {
  @Input() placeholder = '12 345 678';
  @HostBinding('style.display') display = 'block';

  readonly codes: PhoneCode[]   = PHONE_CODES;
  readonly codeCtrl             = new FormControl<string>('+216', { nonNullable: true });
  readonly numberCtrl           = new FormControl<string>('',    { nonNullable: true });
  searchQ  = '';
  isDisabled = false;

  private _subs: Subscription[] = [];
  private _onChange: (v: string) => void = () => {};
  private _onTouched: () => void = () => {};

  readonly selectedEntry = signal<PhoneCode | undefined>(undefined);

  filteredCodes(): PhoneCode[] {
    const q = this.searchQ.toLowerCase().trim();
    return q
      ? this.codes.filter(c =>
          c.country.toLowerCase().includes(q) ||
          c.dialCode.includes(q) ||
          c.flag.includes(q)
        )
      : this.codes;
  }

  onPanelToggle(isOpen: boolean): void {
    if (!isOpen) {
      this.searchQ = '';
    }
  }

  ngOnInit(): void {
    this._updateSelected(this.codeCtrl.value);

    this._subs.push(
      this.codeCtrl.valueChanges.subscribe(v => {
        this._updateSelected(v);
        this._emit();
      }),
      this.numberCtrl.valueChanges.subscribe(() => this._emit()),
    );
  }

  private _updateSelected(code: string): void {
    this.selectedEntry.set(this.codes.find(c => c.dialCode === code));
  }

  private _emit(): void {
    const num = this.numberCtrl.value.trim();
    const val = num ? `${this.codeCtrl.value} ${num}` : '';
    this._onChange(val);
  }

  // ── ControlValueAccessor ──────────────────────────────────────────────────

  writeValue(val: string | null): void {
    if (val) {
      const { dialCode, number } = parsePhone(val);
      this.codeCtrl.setValue(dialCode, { emitEvent: false });
      this.numberCtrl.setValue(number, { emitEvent: false });
      this._updateSelected(dialCode);
    } else {
      this.codeCtrl.setValue('+216', { emitEvent: false });
      this.numberCtrl.setValue('',   { emitEvent: false });
      this._updateSelected('+216');
    }
  }

  registerOnChange(fn: (v: string) => void): void  { this._onChange   = fn; }
  registerOnTouched(fn: () => void): void          { this._onTouched  = fn; }
  setDisabledState(isDisabled: boolean): void       { this.isDisabled  = isDisabled; }

  ngOnDestroy(): void { this._subs.forEach(s => s.unsubscribe()); }
}
