import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe, SlicePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AdminUserOut } from '../../core/models/user.model';
import { ApiService } from '../../core/http/api.service';
import { SortableTableDirective } from '../../shared/sortable-table.directive';
import { AdminAuthService } from '../../core/auth/admin-auth.service';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../shared/confirm-dialog/confirm-dialog.component';
import { UserEditDialogComponent } from './user-edit.dialog';
import { UserCreateDialogComponent } from './user-create.dialog';
import { StudentParcoursDialogComponent } from '../../shared/student-parcours/student-parcours.dialog';
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
  imports: [CommonModule, FormsModule, DatePipe, SlicePipe, MatIconModule, SortableTableDirective,
            MatProgressSpinnerModule, MatDialogModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss',
})
export class UsersComponent implements OnInit {
  private readonly api    = inject(ApiService);
  private readonly auth   = inject(AdminAuthService);
  private readonly dialog = inject(MatDialog);

  readonly loading  = signal(true);
  readonly users    = signal<AdminUserOut[]>([]);
  readonly filtered = signal<AdminUserOut[]>([]);

  searchTerm = '';
  pageSize   = 10;
  pageIndex  = 0;

  paginated(): AdminUserOut[] {
    return this.filtered().slice(this.pageIndex * this.pageSize, (this.pageIndex + 1) * this.pageSize);
  }
  readonly totalPages = computed(() => Math.ceil(this.filtered().length / this.pageSize));

  async ngOnInit(): Promise<void> { await this.reload(); }

  get canCreate(): boolean {
    const role = this.auth.user()?.role;
    return role === 'admin' || role === 'school';
  }

  get canEdit(): boolean {
    return this.auth.user()?.role === 'admin';
  }

  get canDelete(): boolean {
    return this.auth.user()?.role === 'admin';
  }

  async reload(): Promise<void> {
    this.loading.set(true);
    try {
      const role = this.auth.user()?.role;
      let list: AdminUserOut[] = [];
      if (role === 'admin') {
        list = await this.api.get<AdminUserOut[]>('/admin/users');
      } else if (role === 'school') {
        const students = await this.api.get<AdminUserOut[]>('/school/students');
        const profs = await this.api.get<AdminUserOut[]>('/school/professors');
        list = [...students, ...profs];
      } else if (role === 'prof') {
        list = await this.api.get<AdminUserOut[]>('/prof/students');
      }
      this.users.set(list);
      this.applyFilter();
    } finally { this.loading.set(false); }
  }

  applyFilter(): void {
    const q = this.searchTerm.toLowerCase();
    this.filtered.set(q
      ? this.users().filter(u =>
          u.email.toLowerCase().includes(q) ||
          (u.firstName || '').toLowerCase().includes(q) ||
          (u.lastName || '').toLowerCase().includes(q))
      : [...this.users()]);
    this.pageIndex = 0;
  }

  setPage(p: number): void { this.pageIndex = Math.max(0, Math.min(p, this.totalPages() - 1)); }
  pages(): number[] { return Array.from({ length: this.totalPages() }, (_, i) => i); }

  avatarColor(name: string | undefined): string {
    if (!name) return AVATAR_COLORS[0];
    return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
  }

  get isProfView(): boolean {
    return this.auth.user()?.role === 'prof';
  }

  get canViewParcours(): boolean {
    const role = this.auth.user()?.role;
    return role === 'admin' || role === 'prof';
  }

  openParcours(u: AdminUserOut): void {
    this.dialog.open(StudentParcoursDialogComponent, {
      data: { user: u },
      panelClass: 'detail-panel',
      width: '560px',
      maxWidth: '96vw',
    });
  }

  openDetail(u: AdminUserOut): void {
    const data: DetailDialogData = {
      title: u.name ? u.name : `${u.firstName || ''} ${u.lastName || ''}`,
      subtitle: u.email,
      icon: 'person',
      gradient: this.avatarColor(u.firstName || u.name),
      fields: [
        { label: 'Nom',  value: u.name ? u.name : `${u.firstName || ''} ${u.lastName || ''}` },
        { label: 'E-mail',       value: u.email },
        { label: 'Classe',       value: u.classLevel || '—', type: 'code' },
        { label: 'Niveau',       value: u.level || '—',  type: 'code' },
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
      message: `Supprimer définitivement ${user.name ? user.name : (user.firstName + ' ' + user.lastName)} ?`,
    };
    const ok = await firstValueFrom(
      this.dialog.open(ConfirmDialogComponent, { data, width: '380px' }).afterClosed()
    );
    if (!ok) return;
    await this.api.delete(`/admin/users/${user.id}`);
    await this.reload();
  }
}
