import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe, SlicePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AdminUserOut } from '../../core/models/user.model';
import { ApiService } from '../../core/http/api.service';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../shared/confirm-dialog/confirm-dialog.component';
import { UserEditDialogComponent } from './user-edit.dialog';
import { UserCreateDialogComponent } from './user-create.dialog';
import { DetailDialogComponent, DetailDialogData } from '../../shared/detail-dialog/detail-dialog.component';

const AVATAR_COLORS = [
  'linear-gradient(135deg,#6366f1,#8b5cf6)',
  'linear-gradient(135deg,#ec4899,#f97316)',
  'linear-gradient(135deg,#10b981,#06b6d4)',
  'linear-gradient(135deg,#f59e0b,#ef4444)',
  'linear-gradient(135deg,#a855f7,#6366f1)',
];

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, SlicePipe, MatIconModule,
            MatProgressSpinnerModule, MatDialogModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss',
})
export class UsersComponent implements OnInit {
  private readonly api    = inject(ApiService);
  private readonly dialog = inject(MatDialog);

  readonly loading  = signal(true);
  readonly users    = signal<AdminUserOut[]>([]);
  readonly filtered = signal<AdminUserOut[]>([]);

  searchTerm = '';
  pageSize   = 10;
  pageIndex  = 0;

  readonly paginated = computed(() =>
    this.filtered().slice(this.pageIndex * this.pageSize, (this.pageIndex + 1) * this.pageSize)
  );
  readonly totalPages = computed(() => Math.ceil(this.filtered().length / this.pageSize));

  async ngOnInit(): Promise<void> { await this.reload(); }

  async reload(): Promise<void> {
    this.loading.set(true);
    try {
      const list = await this.api.get<AdminUserOut[]>('/admin/users');
      this.users.set(list);
      this.applyFilter();
    } finally { this.loading.set(false); }
  }

  applyFilter(): void {
    const q = this.searchTerm.toLowerCase();
    this.filtered.set(q
      ? this.users().filter(u =>
          u.email.toLowerCase().includes(q) ||
          u.firstName.toLowerCase().includes(q) ||
          u.lastName.toLowerCase().includes(q))
      : [...this.users()]);
    this.pageIndex = 0;
  }

  setPage(p: number): void { this.pageIndex = p; }
  pages(): number[] { return Array.from({ length: this.totalPages() }, (_, i) => i); }

  avatarColor(name: string): string {
    return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
  }

  openDetail(u: AdminUserOut): void {
    const data: DetailDialogData = {
      title: `${u.firstName} ${u.lastName}`,
      subtitle: u.email,
      icon: 'person',
      gradient: this.avatarColor(u.firstName),
      fields: [
        { label: 'Nom complet',  value: `${u.firstName} ${u.lastName}` },
        { label: 'E-mail',       value: u.email },
        { label: 'Niveau',       value: u.level,  type: 'code' },
        { label: 'Rôle',         value: u.role,   type: 'badge',
          badgeClass: u.role === 'admin' ? 'badge-admin' : 'badge-user' },
        { label: 'Statut',       value: u.isActive ? 'Actif' : 'Inactif', type: 'badge',
          badgeClass: u.isActive ? 'badge-active' : 'badge-inactive' },
        { label: 'Créé le',      value: new Date(u.createdAt).toLocaleDateString('fr-FR') },
        { label: 'Identifiant',  value: u.id, type: 'code' },
      ],
    };
    this.dialog.open(DetailDialogComponent, { data, panelClass: 'detail-panel' });
  }

  openCreate(): void {
    this.dialog.open(UserCreateDialogComponent, { panelClass: 'form-dialog-panel' })
      .afterClosed().subscribe(ok => { if (ok) void this.reload(); });
  }

  openEdit(u: AdminUserOut): void {
    this.dialog.open(UserEditDialogComponent, { panelClass: 'form-dialog-panel', data: { user: u } })
      .afterClosed().subscribe(ok => { if (ok) void this.reload(); });
  }

  async confirmDelete(user: AdminUserOut): Promise<void> {
    const data: ConfirmDialogData = {
      title: 'Supprimer l\'utilisateur',
      message: `Supprimer définitivement ${user.firstName} ${user.lastName} ?`,
    };
    const ok = await firstValueFrom(
      this.dialog.open(ConfirmDialogComponent, { data, width: '380px' }).afterClosed()
    );
    if (!ok) return;
    await this.api.delete(`/admin/users/${user.id}`);
    await this.reload();
  }
}
