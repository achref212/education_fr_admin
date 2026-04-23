import { DatePipe, JsonPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';

import { MultiplayerRoomOut } from '../../core/models/room.model';
import { ApiService } from '../../core/http/api.service';

@Component({
  selector: 'app-multiplayer',
  standalone: true,
  imports: [MatTableModule, MatProgressSpinnerModule, JsonPipe, DatePipe],
  templateUrl: './multiplayer.component.html',
  styleUrl: './multiplayer.component.scss',
})
export class MultiplayerComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly loading = signal(true);
  readonly error = signal('');

  displayedColumns = ['roomCode', 'label', 'updatedAt', 'data'];
  dataSource = new MatTableDataSource<MultiplayerRoomOut>([]);

  async ngOnInit(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      this.dataSource.data = await this.api.get<MultiplayerRoomOut[]>(
        '/admin/multiplayer-rooms',
      );
    } catch (e: unknown) {
      this.error.set(e instanceof Error ? e.message : 'Erreur');
    } finally {
      this.loading.set(false);
    }
  }
}
