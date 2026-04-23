import { Component, OnInit, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';

import { QuizQuestionOut } from '../../core/models/quiz.model';
import { ApiService } from '../../core/http/api.service';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../shared/confirm-dialog/confirm-dialog.component';
import { QuizFormDialogComponent } from './quiz-form.dialog';

@Component({
  selector: 'app-quiz-questions',
  standalone: true,
  imports: [MatTableModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './quiz-questions.component.html',
  styleUrl: './quiz-questions.component.scss',
})
export class QuizQuestionsComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly dialog = inject(MatDialog);

  readonly loading = signal(true);
  readonly error = signal('');

  displayedColumns = ['question', 'category', 'level', 'options', 'actions'];
  dataSource = new MatTableDataSource<QuizQuestionOut>([]);

  async ngOnInit(): Promise<void> {
    await this.reload();
  }

  async reload(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      this.dataSource.data = await this.api.get<QuizQuestionOut[]>(
        '/admin/quiz-questions',
      );
    } catch (e: unknown) {
      this.error.set(e instanceof Error ? e.message : 'Erreur');
    } finally {
      this.loading.set(false);
    }
  }

  create(): void {
    const ref = this.dialog.open(QuizFormDialogComponent, {
      data: { row: null },
      width: '640px',
    });
    ref.afterClosed().subscribe((ok) => {
      if (ok) void this.reload();
    });
  }

  edit(row: QuizQuestionOut): void {
    const ref = this.dialog.open(QuizFormDialogComponent, {
      data: { row },
      width: '640px',
    });
    ref.afterClosed().subscribe((ok) => {
      if (ok) void this.reload();
    });
  }

  async remove(row: QuizQuestionOut): Promise<void> {
    const data: ConfirmDialogData = {
      title: 'Supprimer',
      message: 'Supprimer cette question ?',
    };
    const ref = this.dialog.open(ConfirmDialogComponent, { data, width: '360px' });
    const ok = await firstValueFrom(ref.afterClosed());
    if (!ok) return;
    await this.api.delete(`/admin/quiz-questions/${row.id}`);
    await this.reload();
  }
}
