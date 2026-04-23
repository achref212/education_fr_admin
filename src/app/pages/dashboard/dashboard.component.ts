import { Component, OnInit, inject, signal } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ChartConfiguration } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

import { AdminStats } from '../../core/models/stats.model';
import { ApiService } from '../../core/http/api.service';
import { StatCardComponent } from '../../shared/stat-card/stat-card.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    MatProgressSpinnerModule,
    BaseChartDirective,
    StatCardComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly loading = signal(true);
  readonly error = signal('');
  readonly stats = signal<AdminStats | null>(null);

  usersByLevelChart: ChartConfiguration<'bar'> = {
    type: 'bar',
    data: { labels: [], datasets: [] },
    options: {
      responsive: true,
      plugins: { title: { display: true, text: 'Utilisateurs par niveau' } },
    },
  };

  lessonsByCategoryChart: ChartConfiguration<'doughnut'> = {
    type: 'doughnut',
    data: { labels: [], datasets: [] },
    options: {
      responsive: true,
      plugins: { title: { display: true, text: 'Leçons par catégorie' } },
    },
  };

  async ngOnInit(): Promise<void> {
    try {
      const s = await this.api.get<AdminStats>('/admin/stats');
      this.stats.set(s);
      this._patchCharts(s);
    } catch (e: unknown) {
      this.error.set(e instanceof Error ? e.message : 'Erreur chargement');
    } finally {
      this.loading.set(false);
    }
  }

  private _patchCharts(s: AdminStats): void {
    const uLabels = Object.keys(s.usersByLevel);
    const uData = uLabels.map((k) => s.usersByLevel[k]);
    this.usersByLevelChart = {
      type: 'bar',
      data: {
        labels: uLabels,
        datasets: [
          { label: 'Utilisateurs', data: uData, backgroundColor: '#3f51b5' },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: { title: { display: true, text: 'Utilisateurs par niveau' } },
      },
    };

    const cLabels = Object.keys(s.lessonsByCategory);
    const cData = cLabels.map((k) => s.lessonsByCategory[k]);
    this.lessonsByCategoryChart = {
      type: 'doughnut',
      data: {
        labels: cLabels,
        datasets: [
          {
            data: cData,
            backgroundColor: [
              '#3f51b5',
              '#e91e63',
              '#009688',
              '#ff9800',
              '#607d8b',
              '#9c27b0',
            ],
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          title: { display: true, text: 'Leçons par catégorie' },
        },
      },
    };
  }
}
