import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { MultiplayerRoomOut } from '../../core/models/room.model';
import { ApiService } from '../../core/http/api.service';
import { AdminAuthService } from '../../core/auth/admin-auth.service';
import { DetailDialogComponent, DetailDialogData } from '../../shared/detail-dialog/detail-dialog.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-multiplayer',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './multiplayer.component.html',
  styleUrl: './multiplayer.component.scss',
})
export class MultiplayerComponent implements OnInit {
  private readonly api    = inject(ApiService);
  private readonly auth   = inject(AdminAuthService);
  private readonly dialog = inject(MatDialog);

  readonly loading  = signal(true);
  readonly rooms    = signal<MultiplayerRoomOut[]>([]);
  readonly filtered = signal<MultiplayerRoomOut[]>([]);

  searchTerm = '';
  pageSize   = 10;
  pageIndex  = 0;

  readonly paginated  = computed(() => this.filtered().slice(this.pageIndex * this.pageSize, (this.pageIndex + 1) * this.pageSize));
  readonly totalPages = computed(() => Math.ceil(this.filtered().length / this.pageSize));

  async ngOnInit(): Promise<void> {
    this.loading.set(true);
    try {
      const endpoint = this.auth.user()?.role === 'prof' ? '/prof/multiplayer-rooms' : '/admin/multiplayer-rooms';
      const list = await this.api.get<MultiplayerRoomOut[]>(endpoint);
      this.rooms.set(list);
      this.applyFilter();
    } finally { this.loading.set(false); }
  }

  applyFilter(): void {
    const q = this.searchTerm.toLowerCase();
    this.filtered.set(q
      ? this.rooms().filter(r =>
          r.roomCode.toLowerCase().includes(q) ||
          r.label?.toLowerCase().includes(q))
      : [...this.rooms()]);
    this.pageIndex = 0;
  }

  setPage(p: number): void { this.pageIndex = p; }
  pages(): number[] { return Array.from({ length: this.totalPages() }, (_, i) => i); }

  openDetail(r: MultiplayerRoomOut): void {
    const data: DetailDialogData = {
      title: r.label ?? r.roomCode,
      subtitle: `Code : ${r.roomCode}`,
      icon: 'groups',
      gradient: 'linear-gradient(135deg,#a855f7,#7c3aed)',
      fields: [
        { label: 'Code salle',  value: r.roomCode, type: 'code' },
        { label: 'Libellé',     value: r.label ?? '—' },
        { label: 'Statut',      value: this.isActive(r) ? 'Active' : 'Terminée', type: 'badge',
          badgeClass: this.isActive(r) ? 'badge-active' : 'badge-inactive' },
        { label: 'Joueurs',     value: String(this.playerCount(r)) },
        { label: 'Créé le',     value: new Date(r.createdAt).toLocaleString('fr-FR') },
        { label: 'Mis à jour',  value: new Date(r.updatedAt).toLocaleString('fr-FR') },
      ],
    };
    this.dialog.open(DetailDialogComponent, { data, panelClass: 'detail-panel' });
  }

  isActive(r: MultiplayerRoomOut): boolean {
    if (!r.updatedAt) return false;
    const diff = Date.now() - new Date(r.updatedAt).getTime();
    return diff < 30 * 60 * 1000;
  }

  playerCount(r: MultiplayerRoomOut): number {
    const data = r.data as Record<string, unknown> | null;
    if (!data) return 0;
    const players = data['players'];
    return Array.isArray(players) ? players.length : 0;
  }
}
