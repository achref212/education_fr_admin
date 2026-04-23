import { JsonPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';

import { UserProgressItemOut } from '../../core/models/progress.model';
import { ApiService } from '../../core/http/api.service';

@Component({
  selector: 'app-progress',
  standalone: true,
  imports: [MatTableModule, MatProgressSpinnerModule, MatExpansionModule, JsonPipe],
  templateUrl: './progress.component.html',
  styleUrl: './progress.component.scss',
})
export class ProgressComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly loading = signal(true);
  readonly error = signal('');

  displayedColumns = ['email', 'name', 'lessons', 'quizzes'];
  dataSource = new MatTableDataSource<UserProgressItemOut>([]);

  async ngOnInit(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      this.dataSource.data = await this.api.get<UserProgressItemOut[]>(
        '/admin/progress',
      );
    } catch (e: unknown) {
      this.error.set(e instanceof Error ? e.message : 'Erreur');
    } finally {
      this.loading.set(false);
    }
  }

  lessonsCount(row: UserProgressItemOut): number {
    return row.progress.lessonsCompleted?.length ?? 0;
  }

  quizKeys(row: UserProgressItemOut): number {
    return Object.keys(row.progress.quizScores || {}).length;
  }
}
