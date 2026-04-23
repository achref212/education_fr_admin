import { Component, OnInit, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';

import { LessonOut } from '../../core/models/lesson.model';
import { ApiService } from '../../core/http/api.service';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../shared/confirm-dialog/confirm-dialog.component';
import { LessonFormDialogComponent } from './lesson-form.dialog';

@Component({
  selector: 'app-lessons',
  standalone: true,
  imports: [
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  templateUrl: './lessons.component.html',
  styleUrl: './lessons.component.scss',
})
export class LessonsComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly dialog = inject(MatDialog);

  readonly loading = signal(true);
  readonly error = signal('');

  displayedColumns = [
    'title',
    'category',
    'level',
    'sortOrder',
    'actions',
  ];
  dataSource = new MatTableDataSource<LessonOut>([]);

  async ngOnInit(): Promise<void> {
    await this.reload();
  }

  async reload(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      this.dataSource.data = await this.api.get<LessonOut[]>('/admin/lessons');
    } catch (e: unknown) {
      this.error.set(e instanceof Error ? e.message : 'Erreur');
    } finally {
      this.loading.set(false);
    }
  }

  create(): void {
    const ref = this.dialog.open(LessonFormDialogComponent, {
      data: { lesson: null },
      width: '600px',
    });
    ref.afterClosed().subscribe((ok) => {
      if (ok) void this.reload();
    });
  }

  edit(row: LessonOut): void {
    const ref = this.dialog.open(LessonFormDialogComponent, {
      data: { lesson: row },
      width: '600px',
    });
    ref.afterClosed().subscribe((ok) => {
      if (ok) void this.reload();
    });
  }

  async remove(row: LessonOut): Promise<void> {
    const data: ConfirmDialogData = {
      title: 'Supprimer la leçon',
      message: `Supprimer « ${row.title} » ?`,
    };
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data,
      width: '360px',
    });
    const ok = await firstValueFrom(ref.afterClosed());
    if (!ok) return;
    await this.api.delete(`/admin/lessons/${row.id}`);
    await this.reload();
  }
}
