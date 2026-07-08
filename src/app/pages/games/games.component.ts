import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { GameOut } from '../../core/models/game.model';
import { ApiService } from '../../core/http/api.service';
import { GameFormDialogComponent } from './game-form.dialog';

@Component({
  selector: 'app-games',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatProgressSpinnerModule, MatDialogModule],
  templateUrl: './games.component.html',
  styleUrl: './games.component.scss',
})
export class GamesComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly dialog = inject(MatDialog);

  readonly loading = signal(true);
  readonly games = signal<GameOut[]>([]);
  readonly filtered = signal<GameOut[]>([]);

  searchTerm = '';
  pageSize = 10;
  pageIndex = 0;

  readonly paginated = computed(() =>
    this.filtered().slice(this.pageIndex * this.pageSize, (this.pageIndex + 1) * this.pageSize),
  );
  readonly totalPages = computed(() => Math.ceil(this.filtered().length / this.pageSize));

  async ngOnInit(): Promise<void> {
    await this.reload();
  }

  async reload(): Promise<void> {
    this.loading.set(true);
    try {
      const list = await this.api.get<GameOut[]>('/admin/games');
      this.games.set(list);
      this.applyFilter();
    } finally {
      this.loading.set(false);
    }
  }

  applyFilter(): void {
    const q = this.searchTerm.toLowerCase();
    this.filtered.set(
      q
        ? this.games().filter(
            (g) =>
              g.name.toLowerCase().includes(q) ||
              g.slug.toLowerCase().includes(q),
          )
        : [...this.games()],
    );
    this.pageIndex = 0;
  }

  setPage(p: number): void {
    this.pageIndex = p;
  }

  pages(): number[] {
    return Array.from({ length: this.totalPages() }, (_, i) => i);
  }

  openCreate(): void {
    this.dialog
      .open(GameFormDialogComponent, { panelClass: 'form-dialog-panel' })
      .afterClosed()
      .subscribe((ok) => {
        if (ok) void this.reload();
      });
  }

  openEdit(game: GameOut): void {
    this.dialog
      .open(GameFormDialogComponent, {
        panelClass: 'form-dialog-panel',
        data: { game },
      })
      .afterClosed()
      .subscribe((ok) => {
        if (ok) void this.reload();
      });
  }
}
