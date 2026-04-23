import { Component, OnInit, inject, signal, ViewChild } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  MatTable,
  MatTableDataSource,
  MatTableModule,
} from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';

import { AdminUserOut } from '../../core/models/user.model';
import { ApiService } from '../../core/http/api.service';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../shared/confirm-dialog/confirm-dialog.component';
import { UserEditDialogComponent } from './user-edit.dialog';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatTooltipModule,
  ],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss',
})
export class UsersComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly dialog = inject(MatDialog);

  @ViewChild(MatTable) table?: MatTable<AdminUserOut>;

  readonly loading = signal(true);
  readonly error = signal('');

  displayedColumns: string[] = [
    'email',
    'name',
    'level',
    'role',
    'isActive',
    'actions',
  ];
  dataSource = new MatTableDataSource<AdminUserOut>([]);

  async ngOnInit(): Promise<void> {
    await this.reload();
  }

  async reload(): Promise<void> {
    this.error.set('');
    this.loading.set(true);
    try {
      const list = await this.api.get<AdminUserOut[]>('/admin/users');
      this.dataSource.data = list;
    } catch (e: unknown) {
      this.error.set(e instanceof Error ? e.message : 'Erreur');
    } finally {
      this.loading.set(false);
    }
  }

  edit(user: AdminUserOut): void {
    const ref = this.dialog.open(UserEditDialogComponent, {
      width: '420px',
      data: { user },
    });
    ref.afterClosed().subscribe((ok) => {
      if (ok) void this.reload();
    });
  }

  async remove(user: AdminUserOut): Promise<void> {
    const data: ConfirmDialogData = {
      title: 'Supprimer utilisateur',
      message: `Supprimer définitivement ${user.email} ?`,
    };
    const ref = this.dialog.open(ConfirmDialogComponent, { data, width: '360px' });
    const ok = await firstValueFrom(ref.afterClosed());
    if (!ok) return;
    await this.api.delete(`/admin/users/${user.id}`);
    await this.reload();
  }
}
