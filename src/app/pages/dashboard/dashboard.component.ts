import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { ChartConfiguration } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

import { AdminStats } from '../../core/models/stats.model';
import { ApiService } from '../../core/http/api.service';
import { StatCardComponent } from '../../shared/stat-card/stat-card.component';
import { AdminAuthService } from '../../core/auth/admin-auth.service';
import { ThemeService } from '../../core/theme/theme.service';

interface KpiCard { label: string; value: number; hint?: string; }
interface QuickAction { label: string; icon: string; route: string; gradient: string; }
interface ModuleCard {
  label: string; icon: string; route: string;
  gradient: string; color: string;
  description: string;
  count: (s: AdminStats) => number;
}

const CHART_COLORS = ['#6366f1','#ec4899','#10b981','#f59e0b','#06b6d4','#a855f7','#f97316','#ef4444'];

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    MatProgressSpinnerModule,
    MatIconModule,
    BaseChartDirective,
    StatCardComponent,
    RouterLink,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private readonly api   = inject(ApiService);
  private readonly auth  = inject(AdminAuthService);
  private readonly theme = inject(ThemeService);

  readonly loading = signal(true);
  readonly error   = signal('');
  readonly stats   = signal<AdminStats | null>(null);

  get userName(): string {
    const u = this.auth.user();
    return u ? u.firstName : 'Admin';
  }

  readonly modules: ModuleCard[] = [
    {
      label: 'Utilisateurs', icon: 'people', route: '/users',
      gradient: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#818cf8',
      description: 'Gérez les comptes élèves et administrateurs. Modifiez les rôles, niveaux et statuts.',
      count: s => s.totalUsers,
    },
    {
      label: 'Leçons', icon: 'menu_book', route: '/lessons',
      gradient: 'linear-gradient(135deg,#10b981,#34d399)', color: '#34d399',
      description: 'Créez et éditez les leçons pédagogiques par catégorie (grammaire, conjugaison, orthographe, vocabulaire).',
      count: s => s.totalLessons,
    },
    {
      label: 'Quiz', icon: 'quiz', route: '/quiz-questions',
      gradient: 'linear-gradient(135deg,#f59e0b,#fbbf24)', color: '#fbbf24',
      description: 'Ajoutez des questions à choix multiples avec explications pour tester les connaissances des élèves.',
      count: s => s.totalQuizQuestions,
    },
    {
      label: 'Histoires', icon: 'auto_stories', route: '/stories',
      gradient: 'linear-gradient(135deg,#ec4899,#f43f5e)', color: '#f472b6',
      description: 'Publiez des histoires de lecture adaptées à chaque niveau scolaire avec support audio.',
      count: s => s.totalStories,
    },
    {
      label: 'Progression', icon: 'trending_up', route: '/progress',
      gradient: 'linear-gradient(135deg,#10b981,#06b6d4)', color: '#2dd4bf',
      description: 'Suivez la progression de chaque élève : leçons complétées, scores aux quiz et exercices.',
      count: () => 0,
    },
    {
      label: 'Messages', icon: 'mail', route: '/contact-messages',
      gradient: 'linear-gradient(135deg,#f97316,#fb923c)', color: '#fb923c',
      description: 'Consultez et répondez aux messages de contact envoyés par les utilisateurs de la plateforme.',
      count: s => s.unreadMessages,
    },
    {
      label: 'Multijoueur', icon: 'groups', route: '/multiplayer',
      gradient: 'linear-gradient(135deg,#a855f7,#7c3aed)', color: '#c084fc',
      description: 'Supervisez les salles de jeu multijoueur actives et l\'historique des parties disputées.',
      count: s => s.multiplayerRooms,
    },
  ];

  readonly quickActions: QuickAction[] = [
    { label: 'Utilisateurs',   icon: 'people',       route: '/users',            gradient: 'linear-gradient(135deg,#6366f1,#8b5cf6)' },
    { label: 'Leçons',         icon: 'menu_book',     route: '/lessons',          gradient: 'linear-gradient(135deg,#10b981,#34d399)' },
    { label: 'Quiz',           icon: 'quiz',          route: '/quiz-questions',   gradient: 'linear-gradient(135deg,#f59e0b,#fbbf24)' },
    { label: 'Histoires',      icon: 'auto_stories',  route: '/stories',          gradient: 'linear-gradient(135deg,#ec4899,#f43f5e)' },
    { label: 'Messages',       icon: 'mail',          route: '/contact-messages', gradient: 'linear-gradient(135deg,#f97316,#fb923c)' },
    { label: 'Multijoueur',    icon: 'groups',        route: '/multiplayer',      gradient: 'linear-gradient(135deg,#a855f7,#7c3aed)' },
  ];

  usersByLevelChart: ChartConfiguration<'bar'> = {
    type: 'bar',
    data: { labels: [], datasets: [] },
    options: {},
  };

  lessonsByCategoryChart: ChartConfiguration<'doughnut'> = {
    type: 'doughnut',
    data: { labels: [], datasets: [] },
    options: {},
  };

  kpiCards(s: AdminStats): KpiCard[] {
    return [
      { label: 'Utilisateurs',        value: s.totalUsers },
      { label: 'Utilisateurs actifs', value: s.activeUsers },
      { label: 'Leçons',              value: s.totalLessons },
      { label: 'Questions quiz',      value: s.totalQuizQuestions },
      { label: 'Histoires',           value: s.totalStories },
      { label: 'Messages non lus',    value: s.unreadMessages, hint: 'Contact' },
      { label: 'Salles multijoueur',  value: s.multiplayerRooms },
    ];
  }

  async ngOnInit(): Promise<void> {
    try {
      const s = await this.api.get<AdminStats>('/admin/stats');
      this.stats.set(s);
      this._buildCharts(s);
    } catch (e: unknown) {
      this.error.set(e instanceof Error ? e.message : 'Erreur chargement');
    } finally {
      this.loading.set(false);
    }
  }

  private _buildCharts(s: AdminStats): void {
    const isLight   = this.theme.isDark() === false;
    const gridColor = isLight ? 'rgba(99,102,241,.08)' : 'rgba(255,255,255,.05)';
    const tickColor = isLight ? 'rgba(30,27,75,.5)'    : 'rgba(255,255,255,.5)';
    const legendColor = isLight ? 'rgba(30,27,75,.65)' : 'rgba(255,255,255,.55)';

    const uLabels = Object.keys(s.usersByLevel);
    const uData   = uLabels.map(k => s.usersByLevel[k]);

    this.usersByLevelChart = {
      type: 'bar',
      data: {
        labels: uLabels,
        datasets: [{
          label: 'Utilisateurs',
          data: uData,
          backgroundColor: uLabels.map((_, i) => CHART_COLORS[i % CHART_COLORS.length] + 'cc'),
          borderColor:     uLabels.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]),
          borderWidth: 2,
          borderRadius: 8,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, title: { display: false } },
        scales: {
          x: { grid: { color: gridColor }, ticks: { color: tickColor, font: { size: 11 } } },
          y: { grid: { color: gridColor }, ticks: { color: tickColor, font: { size: 11 } }, beginAtZero: true },
        },
      },
    };

    const cLabels = Object.keys(s.lessonsByCategory);
    const cData   = cLabels.map(k => s.lessonsByCategory[k]);

    this.lessonsByCategoryChart = {
      type: 'doughnut',
      data: {
        labels: cLabels,
        datasets: [{
          data: cData,
          backgroundColor: CHART_COLORS.slice(0, cLabels.length).map(c => c + 'cc'),
          borderColor:     CHART_COLORS.slice(0, cLabels.length),
          borderWidth: 2,
          hoverOffset: 8,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { color: legendColor, padding: 16, font: { size: 11 } } },
          title: { display: false },
        },
        cutout: '68%',
      },
    };
  }
}
