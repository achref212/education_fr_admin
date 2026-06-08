import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ContactMessageOut } from '../../core/models/contact.model';
import { ApiService } from '../../core/http/api.service';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../shared/confirm-dialog/confirm-dialog.component';
import { DetailDialogComponent, DetailDialogData } from '../../shared/detail-dialog/detail-dialog.component';

@Component({
  selector: 'app-contact-messages',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './contact-messages.component.html',
  styleUrl: './contact-messages.component.scss',
})
export class ContactMessagesComponent implements OnInit {
  private readonly api    = inject(ApiService);
  private readonly dialog = inject(MatDialog);

  readonly loading  = signal(true);
  readonly messages = signal<ContactMessageOut[]>([]);
  readonly filtered = signal<ContactMessageOut[]>([]);

  searchTerm = '';
  filter: 'all' | 'read' | 'unread' = 'all';
  pageSize   = 10;
  pageIndex  = 0;

  readonly paginated  = computed(() => this.filtered().slice(this.pageIndex * this.pageSize, (this.pageIndex + 1) * this.pageSize));
  readonly totalPages = computed(() => Math.ceil(this.filtered().length / this.pageSize));

  get unreadCount(): number { return this.messages().filter(m => !m.read).length; }

  async ngOnInit(): Promise<void> { await this.reload(); }

  async reload(): Promise<void> {
    this.loading.set(true);
    try {
      const list = await this.api.get<ContactMessageOut[]>('/admin/contact-messages');
      this.messages.set(list);
      this.applyFilter();
    } finally { this.loading.set(false); }
  }

  applyFilter(): void {
    let list = [...this.messages()];
    if (this.filter === 'read')   list = list.filter(m => m.read);
    if (this.filter === 'unread') list = list.filter(m => !m.read);
    const q = this.searchTerm.toLowerCase();
    if (q) list = list.filter(m =>
      m.name?.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      m.subject?.toLowerCase().includes(q));
    this.filtered.set(list);
    this.pageIndex = 0;
  }

  setPage(p: number): void { this.pageIndex = p; }
  pages(): number[] { return Array.from({ length: this.totalPages() }, (_, i) => i); }

  openDetail(m: ContactMessageOut): void {
    const data: DetailDialogData = {
      title: m.subject ?? 'Message sans sujet',
      subtitle: `De ${m.name} — ${m.email}`,
      icon: 'mail',
      gradient: 'linear-gradient(135deg,#f97316,#fb923c)',
      fields: [
        { label: 'Expéditeur', value: m.name },
        { label: 'E-mail',     value: m.email },
        { label: 'Sujet',      value: m.subject },
        { label: 'Statut',     value: m.read ? 'Lu' : 'Non lu', type: 'badge',
          badgeClass: m.read ? 'badge-read' : 'badge-unread' },
        { label: 'Date',       value: new Date(m.createdAt).toLocaleString('fr-FR') },
        { label: 'Message',    value: m.message, type: 'long' },
      ],
    };
    this.dialog.open(DetailDialogComponent, { data, panelClass: 'detail-panel' });
  }

  async markRead(m: ContactMessageOut, read: boolean): Promise<void> {
    await this.api.put<ContactMessageOut>(`/admin/contact-messages/${m.id}`, { read });
    await this.reload();
  }

  async confirmDelete(m: ContactMessageOut): Promise<void> {
    const data: ConfirmDialogData = { title: 'Supprimer le message', message: 'Supprimer ce message définitivement ?' };
    const ok = await firstValueFrom(
      this.dialog.open(ConfirmDialogComponent, { data, width: '380px' }).afterClosed()
    );
    if (!ok) return;
    await this.api.delete(`/admin/contact-messages/${m.id}`);
    await this.reload();
  }
}
