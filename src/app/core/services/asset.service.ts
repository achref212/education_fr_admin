import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { MediaAssetOut } from '../models/media-asset.model';

export interface AssetUploadInput {
  file: File;
  assetType: string;
  ownerType?: string | null;
  ownerId?: string | null;
  title?: string | null;
}

@Injectable({ providedIn: 'root' })
export class AssetService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl.replace(/\/$/, '');

  list(filters: {
    ownerType?: string;
    ownerId?: string;
    assetType?: string;
    isActive?: boolean | null;
  } = {}): Promise<MediaAssetOut[]> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null) {
        params = params.set(key, String(value));
      }
    }
    return firstValueFrom(
      this.http.get<MediaAssetOut[]>(`${this.base}/admin/assets`, { params }),
    );
  }

  registerUrl(body: {
    assetType: string;
    url: string;
    ownerType?: string | null;
    ownerId?: string | null;
    title?: string | null;
    metadata?: Record<string, unknown>;
  }): Promise<MediaAssetOut> {
    return firstValueFrom(
      this.http.post<MediaAssetOut>(`${this.base}/admin/assets`, body),
    );
  }

  upload(input: AssetUploadInput): Promise<MediaAssetOut> {
    const form = new FormData();
    form.append('file', input.file);
    form.append('assetType', input.assetType);
    if (input.ownerType) form.append('ownerType', input.ownerType);
    if (input.ownerId) form.append('ownerId', input.ownerId);
    if (input.title) form.append('title', input.title);
    return firstValueFrom(
      this.http.post<MediaAssetOut>(`${this.base}/admin/assets/upload`, form),
    );
  }

  uploadCurrentProfile(file: File): Promise<MediaAssetOut> {
    const form = new FormData();
    form.append('file', file);
    return firstValueFrom(
      this.http.post<MediaAssetOut>(`${this.base}/assets/profile-upload`, form),
    );
  }

  archive(id: string): Promise<MediaAssetOut> {
    return firstValueFrom(
      this.http.delete<MediaAssetOut>(`${this.base}/admin/assets/${id}`),
    );
  }

  resolveUrl(url?: string | null): string {
    if (!url) return '';
    if (/^https?:\/\//i.test(url) || url.startsWith('data:') || url.startsWith('blob:')) {
      return url;
    }
    return `${this.base}${url.startsWith('/') ? '' : '/'}${url}`;
  }
}
