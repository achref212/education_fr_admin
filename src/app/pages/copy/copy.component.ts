import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-copy',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, RouterLink],
  templateUrl: './copy.component.html',
  styleUrl: './copy.component.scss',
})
export class CopyComponent implements OnInit {
  readonly value = signal('');
  readonly copied = signal(false);
  readonly hasValue = signal(false);

  ngOnInit(): void {
    const hash = window.location.hash.startsWith('#')
      ? window.location.hash.slice(1)
      : window.location.hash;
    const params = new URLSearchParams(hash);
    const encoded = params.get('v');
    if (!encoded) return;
    try {
      const decoded = this.decodeCopyValue(encoded);
      this.value.set(decoded);
      this.hasValue.set(true);
    } catch {
      this.hasValue.set(false);
    }
  }

  async handleCopy(): Promise<void> {
    const text = this.value();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2500);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2500);
    }
  }

  private decodeCopyValue(encoded: string): string {
    const normalized = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const padding = '='.repeat((4 - (normalized.length % 4)) % 4);
    return atob(normalized + padding);
  }
}
