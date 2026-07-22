import { DatePipe, SlicePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { MediaAssetOut } from '../../core/models/media-asset.model';
import { AssetService } from '../../core/services/asset.service';

const ASSET_TYPES = [
  { value: '', label: 'Tous les types' },
  { value: 'profile_image', label: 'Photos profil' },
  { value: 'school_logo', label: 'Logos écoles' },
  { value: 'audio', label: 'Audio' },
  { value: 'image', label: 'Images' },
  { value: 'document', label: 'Documents' },
];

@Component({
  selector: 'app-assets',
  standalone: true,
  imports: [DatePipe, SlicePipe, FormsModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './assets.component.html',
  styleUrl: './assets.component.scss',
})
export class AssetsComponent implements OnInit {
  private readonly assetsApi = inject(AssetService);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly assets = signal<MediaAssetOut[]>([]);
  readonly error = signal('');
  readonly success = signal('');
  readonly assetTypes = ASSET_TYPES;

  typeFilter = '';
  ownerTypeFilter = '';
  urlTitle = '';
  urlValue = '';
  urlAssetType = 'image';
  uploadAssetType = 'image';
  uploadTitle = '';
  selectedFile: File | null = null;

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      this.assets.set(await this.assetsApi.list({
        assetType: this.typeFilter || undefined,
        ownerType: this.ownerTypeFilter || undefined,
      }));
    } catch (e: unknown) {
      this.error.set(e instanceof Error ? e.message : 'Erreur de chargement des ressources');
    } finally {
      this.loading.set(false);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] ?? null;
  }

  async upload(): Promise<void> {
    if (!this.selectedFile) return;
    this.saving.set(true);
    this.error.set('');
    this.success.set('');
    try {
      await this.assetsApi.upload({
        file: this.selectedFile,
        assetType: this.uploadAssetType,
        title: this.uploadTitle || this.selectedFile.name,
      });
      this.selectedFile = null;
      this.uploadTitle = '';
      this.success.set('Ressource téléversée.');
      await this.load();
    } catch (e: unknown) {
      this.error.set(e instanceof Error ? e.message : 'Erreur de téléversement');
    } finally {
      this.saving.set(false);
    }
  }

  async registerUrl(): Promise<void> {
    if (!this.urlValue.trim()) return;
    this.saving.set(true);
    this.error.set('');
    this.success.set('');
    try {
      await this.assetsApi.registerUrl({
        assetType: this.urlAssetType,
        title: this.urlTitle || null,
        url: this.urlValue.trim(),
      });
      this.urlTitle = '';
      this.urlValue = '';
      this.success.set('URL enregistrée.');
      await this.load();
    } catch (e: unknown) {
      this.error.set(e instanceof Error ? e.message : 'Erreur d’enregistrement');
    } finally {
      this.saving.set(false);
    }
  }

  async archive(asset: MediaAssetOut): Promise<void> {
    this.error.set('');
    this.success.set('');
    try {
      await this.assetsApi.archive(asset.id);
      this.success.set('Ressource archivée.');
      await this.load();
    } catch (e: unknown) {
      this.error.set(e instanceof Error ? e.message : 'Erreur d’archivage');
    }
  }

  resolvedUrl(asset: MediaAssetOut): string {
    return this.assetsApi.resolveUrl(asset.url);
  }

  isImage(asset: MediaAssetOut): boolean {
    return asset.assetType === 'profile_image' || asset.assetType === 'school_logo' || asset.assetType === 'image';
  }

  isAudio(asset: MediaAssetOut): boolean {
    return asset.assetType === 'audio';
  }

  typeLabel(value: string): string {
    return ASSET_TYPES.find(type => type.value === value)?.label ?? value;
  }
}
