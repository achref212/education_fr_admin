import { CommonModule } from '@angular/common';
import { Component, Inject, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ApiService } from '../../core/http/api.service';
import { ImportResultOut, ImportRowResultOut } from '../../core/models/user.model';

export interface AccountImportDialogData {
  title: string;
  subtitle: string;
  icon: string;
  accent: string;
  uploadEndpoint: string;
  templateEndpoint: string;
  templateFilename: string;
  resultFilename: string;
  requiredColumns: string[];
}

@Component({
  selector: 'app-account-import-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="import-wrap">
      <div class="import-header" [style.background]="data.accent">
        <div class="header-icon"><mat-icon>{{ data.icon }}</mat-icon></div>
        <div>
          <h2>{{ data.title }}</h2>
          <p>{{ data.subtitle }}</p>
        </div>
        <button class="close-btn" mat-dialog-close type="button"><mat-icon>close</mat-icon></button>
      </div>

      <div class="import-body">
        @if (!result) {
          <div class="template-strip">
            <div>
              <strong>Colonnes attendues</strong>
              <span>{{ data.requiredColumns.join(', ') }}</span>
            </div>
            <button class="ghost-btn" type="button" (click)="downloadTemplate()">
              <mat-icon>download</mat-icon>
              Modèle CSV
            </button>
          </div>

          <label class="drop-zone" [class.has-file]="selectedFile" (dragover)="onDrag($event)" (drop)="onDrop($event)">
            <input type="file" accept=".csv,.xlsx" (change)="onFileInput($event)" />
            <mat-icon>{{ selectedFile ? 'description' : 'upload_file' }}</mat-icon>
            <strong>{{ selectedFile ? selectedFile.name : 'Déposer un fichier CSV ou XLSX' }}</strong>
            <span>{{ selectedFile ? fileSize(selectedFile.size) : 'Les lignes valides seront créées, les autres seront signalées.' }}</span>
          </label>

          @if (error) {
            <div class="import-error"><mat-icon>error_outline</mat-icon>{{ error }}</div>
          }
        } @else {
          <div class="result-summary">
            <div>
              <span>{{ result.totalRows }}</span>
              <small>Lignes lues</small>
            </div>
            <div class="ok">
              <span>{{ result.createdCount }}</span>
              <small>Créées</small>
            </div>
            <div class="bad">
              <span>{{ result.skippedCount }}</span>
              <small>Ignorées</small>
            </div>
          </div>

          <div class="result-actions">
            <button class="ghost-btn" type="button" (click)="downloadResults()">
              <mat-icon>download</mat-icon>
              Résultats CSV
            </button>
          </div>

          <div class="result-table">
            <table>
              <thead>
                <tr>
                  <th>Ligne</th>
                  <th>Nom</th>
                  <th>E-mail</th>
                  <th>Statut</th>
                  <th>Mot de passe</th>
                </tr>
              </thead>
              <tbody>
                @for (row of result.results; track row.rowNumber) {
                  <tr>
                    <td>{{ row.rowNumber }}</td>
                    <td>{{ row.displayName || '-' }}</td>
                    <td>{{ row.email || '-' }}</td>
                    <td>
                      <span class="status" [class.created]="row.status === 'created'">
                        {{ row.status === 'created' ? 'Créé' : row.error || 'Ignoré' }}
                      </span>
                    </td>
                    <td>
                      @if (row.plainPassword) {
                        <button class="password-btn" type="button" (click)="copy(row)">
                          <code>{{ row.plainPassword }}</code>
                          <mat-icon>{{ copiedRow === row.rowNumber ? 'check' : 'content_copy' }}</mat-icon>
                        </button>
                      } @else {
                        <span class="muted">-</span>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>

      <div class="import-footer">
        @if (result) {
          <button class="primary-btn" type="button" (click)="dialogRef.close(true)">
            <mat-icon>done</mat-icon>
            Fermer
          </button>
        } @else {
          <button class="cancel-btn" mat-dialog-close type="button">Annuler</button>
          <button class="primary-btn" type="button" [disabled]="!selectedFile || uploading" (click)="upload()">
            @if (uploading) { <mat-spinner diameter="18" /> }
            @else { <mat-icon>upload</mat-icon> }
            Importer
          </button>
        }
      </div>
    </div>
  `,
  styles: [`
    .import-wrap { min-width: min(760px, 92vw); background: var(--surface-card); color: var(--text-primary); overflow: hidden; border-radius: 18px; }
    .import-header { display: flex; align-items: center; gap: 14px; padding: 18px 20px; color: white; position: relative; }
    .header-icon { width: 44px; height: 44px; border-radius: 12px; background: rgba(255,255,255,.18); display: grid; place-items: center; }
    .header-icon mat-icon { color: white; }
    h2 { margin: 0; font-size: 19px; font-weight: 800; }
    p { margin: 3px 0 0; opacity: .86; font-size: 13px; }
    .close-btn { margin-left: auto; border: none; background: rgba(255,255,255,.14); color: white; border-radius: 10px; width: 36px; height: 36px; cursor: pointer; }
    .import-body { padding: 18px 20px; display: grid; gap: 16px; }
    .template-strip { border: 1px solid var(--border-color); border-radius: 12px; padding: 14px; display: flex; align-items: center; justify-content: space-between; gap: 12px; background: rgba(148,163,184,.06); }
    .template-strip strong, .template-strip span { display: block; }
    .template-strip span { color: var(--text-secondary); font-size: 13px; margin-top: 3px; }
    .ghost-btn, .primary-btn, .cancel-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; border: none; border-radius: 10px; padding: 10px 14px; font-weight: 800; cursor: pointer; white-space: nowrap; }
    .ghost-btn { background: rgba(99,102,241,.11); color: #8b5cf6; }
    .primary-btn { background: linear-gradient(135deg,#6366f1,#8b5cf6); color: white; min-width: 118px; }
    .primary-btn:disabled { opacity: .55; cursor: not-allowed; }
    .cancel-btn { background: rgba(148,163,184,.12); color: var(--text-secondary); }
    .drop-zone { border: 1.5px dashed rgba(99,102,241,.5); border-radius: 14px; min-height: 170px; display: grid; place-items: center; text-align: center; padding: 24px; cursor: pointer; background: rgba(99,102,241,.05); }
    .drop-zone.has-file { border-style: solid; background: rgba(16,185,129,.07); }
    .drop-zone input { display: none; }
    .drop-zone mat-icon { font-size: 42px; width: 42px; height: 42px; color: #818cf8; }
    .drop-zone strong { margin-top: 8px; font-size: 15px; }
    .drop-zone span { color: var(--text-secondary); font-size: 13px; margin-top: 4px; }
    .import-error { display: flex; align-items: center; gap: 8px; color: #fca5a5; background: rgba(239,68,68,.1); border: 1px solid rgba(239,68,68,.24); border-radius: 10px; padding: 11px 12px; font-size: 13px; }
    .result-summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
    .result-summary div { border: 1px solid var(--border-color); border-radius: 12px; padding: 14px; background: rgba(148,163,184,.06); }
    .result-summary span { display: block; font-size: 24px; font-weight: 900; }
    .result-summary small { color: var(--text-secondary); }
    .result-summary .ok span { color: #10b981; }
    .result-summary .bad span { color: #f59e0b; }
    .result-actions { display: flex; justify-content: flex-end; }
    .result-table { max-height: 330px; overflow: auto; border: 1px solid var(--border-color); border-radius: 12px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td { padding: 11px 12px; border-bottom: 1px solid var(--border-color); text-align: left; vertical-align: top; }
    th { color: var(--text-secondary); font-size: 12px; text-transform: uppercase; letter-spacing: .04em; background: rgba(148,163,184,.07); position: sticky; top: 0; }
    .status { color: #f59e0b; }
    .status.created { color: #10b981; font-weight: 800; }
    .password-btn { display: inline-flex; align-items: center; gap: 7px; border: none; background: rgba(99,102,241,.1); color: #818cf8; border-radius: 8px; padding: 6px 8px; cursor: pointer; }
    .password-btn code { color: inherit; }
    .muted { color: var(--text-secondary); }
    .import-footer { padding: 14px 20px 18px; display: flex; justify-content: flex-end; gap: 10px; border-top: 1px solid var(--border-color); }
    @media (max-width: 640px) {
      .template-strip, .import-footer { flex-direction: column; align-items: stretch; }
      .result-summary { grid-template-columns: 1fr; }
    }
  `],
})
export class AccountImportDialogComponent {
  private readonly api = inject(ApiService);
  selectedFile: File | null = null;
  uploading = false;
  error = '';
  result: ImportResultOut | null = null;
  copiedRow: number | null = null;

  constructor(
    public readonly dialogRef: MatDialogRef<AccountImportDialogComponent, boolean>,
    @Inject(MAT_DIALOG_DATA) public readonly data: AccountImportDialogData,
  ) {}

  onDrag(event: DragEvent): void {
    event.preventDefault();
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (file) this.selectFile(file);
  }

  onFileInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.selectFile(file);
  }

  selectFile(file: File): void {
    this.error = '';
    if (!/\.(csv|xlsx)$/i.test(file.name)) {
      this.error = 'Choisissez un fichier CSV ou XLSX.';
      this.selectedFile = null;
      return;
    }
    this.selectedFile = file;
  }

  async upload(): Promise<void> {
    if (!this.selectedFile) return;
    this.uploading = true;
    this.error = '';
    try {
      const form = new FormData();
      form.append('file', this.selectedFile);
      this.result = await this.api.postForm<ImportResultOut>(this.data.uploadEndpoint, form);
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Import impossible.';
    } finally {
      this.uploading = false;
    }
  }

  async downloadTemplate(): Promise<void> {
    const blob = await this.api.download(this.data.templateEndpoint);
    this.saveBlob(blob, this.data.templateFilename);
  }

  downloadResults(): void {
    if (!this.result) return;
    const rows = [
      ['Ligne', 'Statut', 'Nom', 'Email', 'Mot de passe', 'Erreur'],
      ...this.result.results.map(row => [
        String(row.rowNumber),
        row.status === 'created' ? 'Créé' : 'Ignoré',
        row.displayName ?? '',
        row.email ?? '',
        row.plainPassword ?? '',
        row.error ?? '',
      ]),
    ];
    const csv = rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
    this.saveBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), this.data.resultFilename);
  }

  async copy(row: ImportRowResultOut): Promise<void> {
    if (!row.plainPassword) return;
    await navigator.clipboard.writeText(row.plainPassword);
    this.copiedRow = row.rowNumber;
    setTimeout(() => {
      if (this.copiedRow === row.rowNumber) this.copiedRow = null;
    }, 1600);
  }

  fileSize(size: number): string {
    if (size < 1024) return `${size} o`;
    if (size < 1024 * 1024) return `${Math.round(size / 1024)} Ko`;
    return `${(size / 1024 / 1024).toFixed(1)} Mo`;
  }

  private saveBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }
}
