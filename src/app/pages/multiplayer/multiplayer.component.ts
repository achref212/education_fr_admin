import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { MultiplayerRoomOut } from '../../core/models/room.model';
import { ApiService } from '../../core/http/api.service';
import { SortableTableDirective } from '../../shared/sortable-table.directive';
import { AdminAuthService } from '../../core/auth/admin-auth.service';
import { DetailDialogComponent, DetailDialogData } from '../../shared/detail-dialog/detail-dialog.component';
import { RoomCreateDialogComponent } from './room-create.dialog';

@Component({
  selector: 'app-multiplayer',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, MatIconModule, MatProgressSpinnerModule, MatDialogModule, SortableTableDirective],
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

  paginated(): MultiplayerRoomOut[] { return this.filtered().slice(this.pageIndex * this.pageSize, (this.pageIndex + 1) * this.pageSize); }
  readonly totalPages = computed(() => Math.ceil(this.filtered().length / this.pageSize));

  get isProf(): boolean {
    return this.auth.isProf();
  }

  async ngOnInit(): Promise<void> {
    await this.reload();
  }

  async reload(): Promise<void> {
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
          r.label?.toLowerCase().includes(q) ||
          r.classLevel?.toLowerCase().includes(q))
      : [...this.rooms()]);
    this.pageIndex = 0;
  }

  setPage(p: number): void { this.pageIndex = Math.max(0, Math.min(p, this.totalPages() - 1)); }
  pages(): number[] { return Array.from({ length: this.totalPages() }, (_, i) => i); }

  openCreate(): void {
    this.dialog.open(RoomCreateDialogComponent, { panelClass: 'form-dialog-panel' })
      .afterClosed().subscribe(ok => { if (ok) void this.reload(); });
  }

  openDetail(r: MultiplayerRoomOut): void {
    const participants = this.participantNames(r);
    const data: DetailDialogData = {
      title: r.label ?? r.roomCode,
      subtitle: `Code : ${r.roomCode}`,
      icon: 'groups',
      gradient: 'linear-gradient(135deg,#a855f7,#7c3aed)',
      fields: [
        { label: 'Code salle',  value: r.roomCode, type: 'code' },
        { label: 'Libellé',     value: r.label ?? '—' },
        { label: 'Groupe',      value: r.classLevel ?? '—' },
        { label: 'Statut',      value: this.roomStatus(r), type: 'badge',
          badgeClass: this.isActive(r) ? 'badge-active' : 'badge-inactive' },
        { label: 'Partie active', value: r.activeSessionId ? 'Oui' : 'Non' },
        { label: 'Difficultés', value: this.allowedDifficulties(r) },
        { label: 'Joueurs',     value: String(this.playerCount(r)) },
        { label: 'Participants', value: participants.length ? participants.join(', ') : '—', type: 'long' },
        { label: 'Créé le',     value: new Date(r.createdAt).toLocaleString('fr-FR') },
        { label: 'Mis à jour',  value: new Date(r.updatedAt).toLocaleString('fr-FR') },
      ],
    };
    this.dialog.open(DetailDialogComponent, { data, panelClass: 'detail-panel' });
  }

  isActive(r: MultiplayerRoomOut): boolean {
    const status = (r.data?.['status'] as string | undefined) ?? '';
    if (status === 'in_progress') return true;
    if (status === 'finished') return false;
    if (!r.updatedAt) return false;
    const diff = Date.now() - new Date(r.updatedAt).getTime();
    return diff < 30 * 60 * 1000;
  }

  roomStatus(r: MultiplayerRoomOut): string {
    const status = r.data?.['status'] as string | undefined;
    if (status === 'in_progress') return 'Partie en cours';
    if (status === 'finished') return 'Terminée';
    if (status === 'waiting') return 'En attente';
    return this.isActive(r) ? 'Active' : 'Terminée';
  }

  allowedDifficulties(r: MultiplayerRoomOut): string {
    const list = r.data?.['allowedDifficulties'];
    if (Array.isArray(list) && list.length) return list.join(', ');
    return 'easy, medium, hard';
  }

  playerCount(r: MultiplayerRoomOut): number {
    if (r.participantCount != null && r.participantCount > 0) return r.participantCount;
    const data = r.data as Record<string, unknown> | null;
    if (!data) return 0;
    const participants = data['participants'];
    if (Array.isArray(participants)) return participants.length;
    const players = data['players'];
    return Array.isArray(players) ? players.length : 0;
  }

  participantNames(r: MultiplayerRoomOut): string[] {
    const data = r.data as Record<string, unknown> | null;
    const raw = data?.['participants'];
    if (!Array.isArray(raw)) return [];
    return raw
      .map(item => {
        if (!item || typeof item !== 'object') return '';
        const row = item as Record<string, unknown>;
        const first = String(row['firstName'] ?? '');
        const last = String(row['lastName'] ?? '');
        return `${first} ${last}`.trim();
      })
      .filter(Boolean);
  }
}
