import { Component, OnInit, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';

import { StoryOut } from '../../core/models/story.model';
import { ApiService } from '../../core/http/api.service';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../shared/confirm-dialog/confirm-dialog.component';
import { StoryFormDialogComponent } from './story-form.dialog';

@Component({
  selector: 'app-stories',
  standalone: true,
  imports: [MatTableModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './stories.component.html',
  styleUrl: './stories.component.scss',
})
export class StoriesComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly dialog = inject(MatDialog);

  readonly loading = signal(true);
  readonly error = signal('');

  displayedColumns = ['title', 'level', 'actions'];
  dataSource = new MatTableDataSource<StoryOut>([]);

  async ngOnInit(): Promise<void> {
    await this.reload();
  }

  async reload(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      this.dataSource.data = await this.api.get<StoryOut[]>('/admin/stories');
    } catch (e: unknown) {
      this.error.set(e instanceof Error ? e.message : 'Erreur');
    } finally {
      this.loading.set(false);
    }
  }

  create(): void {
    this.dialog
      .open(StoryFormDialogComponent, { data: { row: null }, width: '560px' })
      .afterClosed()
      .subscribe((ok) => {
        if (ok) void this.reload();
      });
  }

  edit(row: StoryOut): void {
    this.dialog
      .open(StoryFormDialogComponent, { data: { row }, width: '560px' })
      .afterClosed()
      .subscribe((ok) => {
        if (ok) void this.reload();
      });
  }

  async remove(row: StoryOut): Promise<void> {
    const data: ConfirmDialogData = { title: 'Supprimer', message: `« ${row.title} » ?` };
    const ref = this.dialog.open(ConfirmDialogComponent, { data, width: '360px' });
    const ok = await firstValueFrom(ref.afterClosed());
    if (!ok) return;
    await this.api.delete(`/admin/stories/${row.id}`);
    await this.reload();
  }
}
