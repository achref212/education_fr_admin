import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { AdminUserOut } from '../../core/models/user.model';
import { ApiService } from '../../core/http/api.service';
import { SortableTableDirective } from '../../shared/sortable-table.directive';
import { DetailDialogComponent, DetailDialogData } from '../../shared/detail-dialog/detail-dialog.component';
import { ProfessorCreateDialogComponent } from './professor-create.dialog';

const AVATAR_COLORS = [
  'linear-gradient(135deg,#6366f1,#8b5cf6)',
  'linear-gradient(135deg,#ec4899,#f97316)',
  'linear-gradient(135deg,#10b981,#06b6d4)',
  'linear-gradient(135deg,#f59e0b,#ef4444)',
];

@Component({
  selector: 'app-school-professors',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, MatIconModule, MatProgressSpinnerModule, MatDialogModule, SortableTableDirective],
  templateUrl: './school-professors.component.html',
  styleUrl: './school-professors.component.scss',
})
export class SchoolProfessorsComponent implements OnInit {
  private readonly api    = inject(ApiService);
  private readonly dialog = inject(MatDialog);

  readonly loading  = signal(true);
  readonly professors = signal<AdminUserOut[]>([]);
  readonly filtered = signal<AdminUserOut[]>([]);

  searchTerm = '';
  pageSize   = 10;
  pageIndex  = 0;

  paginated(): AdminUserOut[] {
    return this.filtered().slice(this.pageIndex * this.pageSize, (this.pageIndex + 1) * this.pageSize);
  }
  readonly totalPages = computed(() => Math.ceil(this.filtered().length / this.pageSize));

  async ngOnInit(): Promise<void> {
    await this.reload();
  }

  async reload(): Promise<void> {
    this.loading.set(true);
    try {
      const list = await this.api.get<AdminUserOut[]>('/school/professors');
      this.professors.set(list);
      this.applyFilter();
    } finally {
      this.loading.set(false);
    }
  }

  applyFilter(): void {
    const q = this.searchTerm.toLowerCase();
    this.filtered.set(q
      ? this.professors().filter(u =>
          u.email.toLowerCase().includes(q) ||
          (u.firstName || '').toLowerCase().includes(q) ||
          (u.lastName || '').toLowerCase().includes(q))
      : [...this.professors()]);
    this.pageIndex = 0;
  }

  setPage(p: number): void { this.pageIndex = Math.max(0, Math.min(p, this.totalPages() - 1)); }
  pages(): number[] { return Array.from({ length: this.totalPages() }, (_, i) => i); }

  avatarColor(name: string | undefined): string {
    if (!name) return AVATAR_COLORS[0];
    return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
  }

  openDetail(u: AdminUserOut): void {
    const data: DetailDialogData = {
      title: `${u.firstName || ''} ${u.lastName || ''}`.trim(),
      subtitle: u.email,
      icon: 'badge',
      gradient: this.avatarColor(u.firstName),
      fields: [
        { label: 'Prénom', value: u.firstName || '—' },
        { label: 'Nom', value: u.lastName || '—' },
        { label: 'E-mail', value: u.email },
        { label: 'Téléphone', value: u.phone || '—' },
        { label: 'Date de naissance', value: u.dateOfBirth ? new Date(u.dateOfBirth).toLocaleDateString('fr-FR') : '—' },
        { label: 'Rôle', value: 'Professeur', type: 'badge', badgeClass: 'badge-admin' },
        { label: 'Statut', value: u.isActive ? 'Actif' : 'Inactif', type: 'badge',
          badgeClass: u.isActive ? 'badge-active' : 'badge-inactive' },
        { label: 'Créé le', value: new Date(u.createdAt).toLocaleDateString('fr-FR') },
      ],
    };
    this.dialog.open(DetailDialogComponent, { data, panelClass: 'detail-panel' });
  }

  openCreate(): void {
    this.dialog.open(ProfessorCreateDialogComponent, { panelClass: 'form-dialog-panel' })
      .afterClosed().subscribe(ok => { if (ok) void this.reload(); });
  }
}
