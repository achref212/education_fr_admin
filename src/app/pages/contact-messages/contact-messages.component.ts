import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';

import { ContactMessageOut } from '../../core/models/contact.model';
import { ApiService } from '../../core/http/api.service';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-contact-messages',
  standalone: true,
  imports: [
    DatePipe,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './contact-messages.component.html',
  styleUrl: './contact-messages.component.scss',
})
export class ContactMessagesComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly dialog = inject(MatDialog);

  readonly loading = signal(true);
  readonly error = signal('');

  displayedColumns = [
    'createdAt',
    'name',
    'email',
    'subject',
    'read',
    'actions',
  ];
  dataSource = new MatTableDataSource<ContactMessageOut>([]);

  async ngOnInit(): Promise<void> {
    await this.reload();
  }

  async reload(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      this.dataSource.data = await this.api.get<ContactMessageOut[]>(
        '/admin/contact-messages',
      );
    } catch (e: unknown) {
      this.error.set(e instanceof Error ? e.message : 'Erreur');
    } finally {
      this.loading.set(false);
    }
  }

  async markRead(m: ContactMessageOut, read: boolean): Promise<void> {
    await this.api.put<ContactMessageOut>(`/admin/contact-messages/${m.id}`, { read });
    await this.reload();
  }

  async remove(m: ContactMessageOut): Promise<void> {
    const data: ConfirmDialogData = {
      title: 'Supprimer le message',
      message: 'Supprimer ce message ?',
    };
    const ref = this.dialog.open(ConfirmDialogComponent, { data, width: '360px' });
    const ok = await firstValueFrom(ref.afterClosed());
    if (!ok) return;
    await this.api.delete(`/admin/contact-messages/${m.id}`);
    await this.reload();
  }
}
