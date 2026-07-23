import { NgClass } from '@angular/common';
import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  ViewChild,
  inject,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { MediaAssetOut } from '../../core/models/media-asset.model';
import { AssetService } from '../../core/services/asset.service';

const RECORDER_MIME_TYPES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/ogg;codecs=opus',
  'audio/ogg',
  'audio/mp4',
];

@Component({
  selector: 'app-audio-recorder-picker',
  standalone: true,
  imports: [NgClass, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './audio-recorder-picker.component.html',
  styleUrl: './audio-recorder-picker.component.scss',
})
export class AudioRecorderPickerComponent implements OnDestroy {
  private readonly assets = inject(AssetService);

  @Input() audioUrl: string | null = null;
  @Input() title: string | null = null;
  @Input() ownerType: string | null = null;
  @Input() ownerId: string | null = null;
  @Input() disabled = false;
  @Input() compact = false;

  @Output() readonly audioUrlChange = new EventEmitter<string>();
  @Output() readonly assetUploaded = new EventEmitter<MediaAssetOut>();
  @Output() readonly busyChange = new EventEmitter<boolean>();
  @Output() readonly errorChange = new EventEmitter<string>();

  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;

  uploading = false;
  recording = false;
  elapsedSeconds = 0;
  error = '';
  recordedPreviewUrl = '';
  readonly bars = Array.from({ length: 18 }, () => 14);

  private recorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private chunks: Blob[] = [];
  private recordedBlob: Blob | null = null;
  private timerId: number | null = null;
  private animationId: number | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private discardRecording = false;

  ngOnDestroy(): void {
    this.stopRecordingResources();
    this.revokeRecordedPreview();
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.revokeRecordedPreview();
    this.recordedBlob = null;
    await this.uploadFile(file);
    input.value = '';
  }

  async startRecording(): Promise<void> {
    if (this.disabled || this.uploading || this.recording) return;
    this.setError('');
    this.revokeRecordedPreview();
    this.recordedBlob = null;
    this.chunks = [];
    this.discardRecording = false;
    this.elapsedSeconds = 0;

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      this.setError("L'enregistrement audio n'est pas supporté par ce navigateur.");
      return;
    }

    try {
      const mimeType = this.bestRecorderMimeType();
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.recorder = mimeType
        ? new MediaRecorder(this.stream, { mimeType })
        : new MediaRecorder(this.stream);
      this.recorder.ondataavailable = (event) => {
        if (event.data.size > 0) this.chunks.push(event.data);
      };
      this.recorder.onstop = () => this.finishRecording();
      this.recorder.onerror = () => {
        this.setError("L'enregistrement a été interrompu.");
        this.cancelRecording();
      };
      this.recorder.start();
      this.recording = true;
      this.emitBusy();
      this.startTimer();
      this.startWaveform(this.stream);
    } catch {
      this.stopRecordingResources();
      this.setError("Impossible d'accéder au microphone. Vérifiez l'autorisation du navigateur.");
    }
  }

  stopRecording(): void {
    if (!this.recorder || this.recorder.state === 'inactive') return;
    this.recorder.stop();
  }

  cancelRecording(): void {
    this.discardRecording = true;
    this.chunks = [];
    this.recordedBlob = null;
    this.revokeRecordedPreview();
    if (this.recorder && this.recorder.state !== 'inactive') {
      this.recorder.stop();
    }
    this.stopRecordingResources();
    this.elapsedSeconds = 0;
  }

  async saveRecording(): Promise<void> {
    if (!this.recordedBlob || this.uploading) return;
    const mimeType = this.recordedBlob.type || 'audio/webm';
    const extension = this.extensionForMimeType(mimeType);
    const file = new File(
      [this.recordedBlob],
      `${this.safeTitle() || 'enregistrement-audio'}-${Date.now()}.${extension}`,
      { type: mimeType },
    );
    await this.uploadFile(file);
    if (!this.error) {
      this.recordedBlob = null;
      this.revokeRecordedPreview();
      this.elapsedSeconds = 0;
    }
  }

  previewUrl(): string {
    return this.recordedPreviewUrl || this.assets.resolveUrl(this.audioUrl);
  }

  hasAudio(): boolean {
    return Boolean(this.recordedPreviewUrl || this.audioUrl);
  }

  formattedElapsed(): string {
    const minutes = Math.floor(this.elapsedSeconds / 60).toString().padStart(2, '0');
    const seconds = (this.elapsedSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  }

  private async uploadFile(file: File): Promise<void> {
    this.uploading = true;
    this.emitBusy();
    this.setError('');
    try {
      const asset = await this.assets.upload({
        file,
        assetType: 'audio',
        ownerType: this.ownerType,
        ownerId: this.ownerId,
        title: this.title || file.name,
      });
      this.audioUrl = asset.url;
      this.audioUrlChange.emit(asset.url);
      this.assetUploaded.emit(asset);
    } catch {
      this.setError('Erreur lors du téléversement audio.');
    } finally {
      this.uploading = false;
      this.emitBusy();
    }
  }

  private finishRecording(): void {
    if (this.discardRecording) {
      this.discardRecording = false;
      this.chunks = [];
      this.stopRecordingResources();
      return;
    }
    const mimeType = this.recorder?.mimeType || this.bestRecorderMimeType() || 'audio/webm';
    this.recordedBlob = new Blob(this.chunks, { type: mimeType });
    if (this.recordedBlob.size === 0) {
      this.setError('Enregistrement vide.');
      this.recordedBlob = null;
    } else {
      this.recordedPreviewUrl = URL.createObjectURL(this.recordedBlob);
    }
    this.stopRecordingResources();
  }

  private stopRecordingResources(): void {
    this.recording = false;
    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }
    if (this.animationId !== null) {
      window.cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.audioContext?.close().catch(() => undefined);
    this.audioContext = null;
    this.analyser = null;
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
    this.recorder = null;
    this.bars.fill(14);
    this.emitBusy();
  }

  private startTimer(): void {
    this.timerId = window.setInterval(() => {
      this.elapsedSeconds += 1;
    }, 1000);
  }

  private startWaveform(stream: MediaStream): void {
    this.audioContext = new AudioContext();
    const source = this.audioContext.createMediaStreamSource(stream);
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 64;
    source.connect(this.analyser);
    const values = new Uint8Array(this.analyser.frequencyBinCount);
    const draw = () => {
      if (!this.analyser || !this.recording) return;
      this.analyser.getByteFrequencyData(values);
      for (let index = 0; index < this.bars.length; index += 1) {
        const value = values[index % values.length] ?? 0;
        this.bars[index] = 10 + Math.round((value / 255) * 34);
      }
      this.animationId = window.requestAnimationFrame(draw);
    };
    draw();
  }

  private bestRecorderMimeType(): string {
    return RECORDER_MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type)) ?? '';
  }

  private extensionForMimeType(mimeType: string): string {
    const clean = mimeType.split(';')[0].trim().toLowerCase();
    if (clean === 'audio/ogg') return 'ogg';
    if (clean === 'audio/mp4') return 'm4a';
    if (clean === 'audio/wav' || clean === 'audio/x-wav') return 'wav';
    return 'webm';
  }

  private safeTitle(): string {
    return (this.title || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private revokeRecordedPreview(): void {
    if (!this.recordedPreviewUrl) return;
    URL.revokeObjectURL(this.recordedPreviewUrl);
    this.recordedPreviewUrl = '';
  }

  private setError(message: string): void {
    this.error = message;
    this.errorChange.emit(message);
  }

  private emitBusy(): void {
    this.busyChange.emit(this.uploading || this.recording);
  }
}
