export interface MediaAssetOut {
  id: string;
  ownerType?: string | null;
  ownerId?: string | null;
  assetType: 'profile_image' | 'school_logo' | 'audio' | 'image' | 'document' | string;
  title?: string | null;
  url: string;
  storagePath?: string | null;
  mimeType?: string | null;
  sizeBytes?: number | null;
  metadata: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
