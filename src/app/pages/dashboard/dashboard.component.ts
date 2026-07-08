import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { ChartConfiguration } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

import { AdminStats } from '../../core/models/stats.model';
import { AdminUserOut, SchoolStats } from '../../core/models/user.model';
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
  adminOnly?: boolean;
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
  readonly auth  = inject(AdminAuthService);
  private readonly theme = inject(ThemeService);

  readonly loading = signal(true);
  readonly error   = signal('');
  readonly stats   = signal<AdminStats | null>(null);
  readonly schoolStats = signal<SchoolStats | null>(null);
  readonly profStats = signal<{ studentCount: number; activeStudents: number } | null>(null);

  get userName(): string {
    const u = this.auth.user();
    if (!u) return 'Utilisateur';
    if (u.role === 'school') return u.name || 'École';
    return `${u.firstName} ${u.lastName}`;
  }

  readonly schoolModules: ModuleCard[] = [
    {
      label: 'Élèves', icon: 'school', route: '/students',
      gradient: 'linear-gradient(135deg,#10b981,#06b6d4)', color: '#2dd4bf',
      description: 'Consultez vos élèves, leur parcours DELF et progression par niveau scolaire.',
      count: (_s) => this.schoolStats()?.studentCount ?? 0,
    },
    {
      label: 'Professeurs', icon: 'badge', route: '/professors',
      gradient: 'linear-gradient(135deg,#6366f1,#a855f7)', color: '#a78bfa',
      description: 'Créez et gérez les comptes professeurs de votre établissement.',
      count: (_s) => this.schoolStats()?.professorCount ?? 0,
    },
  ];

  readonly profModules: ModuleCard[] = [
    {
      label: 'Élèves', icon: 'people', route: '/users',
      gradient: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#818cf8',
      description: 'Consultez vos élèves et leur parcours DELF détaillé (étapes, XP, streak).',
      count: (_s) => this.profStats()?.studentCount ?? 0,
    },
    {
      label: 'Leçons', icon: 'menu_book', route: '/lessons',
      gradient: 'linear-gradient(135deg,#10b981,#34d399)', color: '#34d399',
      description: 'Créez et éditez les leçons pédagogiques pour vos classes.',
      count: () => 0,
    },
    {
      label: 'Multijoueur', icon: 'groups', route: '/multiplayer',
      gradient: 'linear-gradient(135deg,#a855f7,#7c3aed)', color: '#c084fc',
      description: 'Organisez des quiz duels et défis entre amis avec difficulté adaptée.',
      count: () => 0,
    },
  ];

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
      description: 'Supervisez les salles de jeu actives et l\'historique des parties disputées.',
      count: s => s.multiplayerRooms,
    },
    {
      label: 'Parcours DELF', icon: 'route', route: '/learning-paths',
      gradient: 'linear-gradient(135deg,#6366f1,#06b6d4)', color: '#22d3ee',
      description: 'Configurez les parcours structurés par niveau scolaire avec objectifs DELF et étapes.',
      count: () => 0,
      adminOnly: true,
    },
    {
      label: 'Tests DELF', icon: 'assignment', route: '/delf-tests',
      gradient: 'linear-gradient(135deg,#6366f1,#ec4899)', color: '#f472b6',
      description: 'Consultez les tests de niveau DELF par catégorie et configurez les seuils d\'évaluation.',
      count: () => 0,
      adminOnly: true,
    },
    {
      label: 'Jeux multijoueur', icon: 'sports_esports', route: '/games',
      gradient: 'linear-gradient(135deg,#a855f7,#7c3aed)', color: '#c084fc',
      description: 'Gérez le catalogue de jeux (quiz duel, défis entre amis) pour les salles multijoueur.',
      count: () => 0,
      adminOnly: true,
    },
    {
      label: 'Établissements', icon: 'school', route: '/schools',
      gradient: 'linear-gradient(135deg,#10b981,#06b6d4)', color: '#34d399',
      description: 'Créez et gérez les comptes établissements scolaires partenaires de la plateforme.',
      count: s => s.totalSchools,
      adminOnly: true,
    },
  ];

  readonly quickActions: QuickAction[] = [
    { label: 'Utilisateurs',   icon: 'people',       route: '/users',            gradient: 'linear-gradient(135deg,#6366f1,#8b5cf6)' },
    { label: 'Leçons',         icon: 'menu_book',     route: '/lessons',          gradient: 'linear-gradient(135deg,#10b981,#34d399)' },
    { label: 'Quiz',           icon: 'quiz',          route: '/quiz-questions',   gradient: 'linear-gradient(135deg,#f59e0b,#fbbf24)' },
    { label: 'Histoires',      icon: 'auto_stories',  route: '/stories',          gradient: 'linear-gradient(135deg,#ec4899,#f43f5e)' },
    { label: 'Messages',       icon: 'mail',          route: '/contact-messages', gradient: 'linear-gradient(135deg,#f97316,#fb923c)' },
    { label: 'Multijoueur',    icon: 'groups',        route: '/multiplayer',      gradient: 'linear-gradient(135deg,#a855f7,#7c3aed)' },
    { label: 'Parcours DELF',  icon: 'route',         route: '/learning-paths',   gradient: 'linear-gradient(135deg,#6366f1,#06b6d4)' },
    { label: 'Tests DELF',     icon: 'assignment',    route: '/delf-tests',       gradient: 'linear-gradient(135deg,#6366f1,#ec4899)' },
    { label: 'Jeux',           icon: 'sports_esports', route: '/games',           gradient: 'linear-gradient(135deg,#a855f7,#7c3aed)' },
  ];

  get filteredModules(): ModuleCard[] {
    const role = this.auth.user()?.role;
    if (role === 'admin') return this.modules;
    if (role === 'school') return this.schoolModules;
    if (role === 'prof') {
      return this.profModules;
    }
    return [];
  }

  get filteredQuickActions(): QuickAction[] {
    const role = this.auth.user()?.role;
    if (role === 'admin') return this.quickActions;
    if (role === 'school') {
      return [
        { label: 'Élèves', icon: 'school', route: '/students', gradient: 'linear-gradient(135deg,#10b981,#06b6d4)' },
        { label: 'Professeurs', icon: 'badge', route: '/professors', gradient: 'linear-gradient(135deg,#6366f1,#a855f7)' },
      ];
    }
    if (role === 'prof') {
      return [
        { label: 'Élèves', icon: 'people', route: '/users', gradient: 'linear-gradient(135deg,#6366f1,#8b5cf6)' },
        { label: 'Leçons', icon: 'menu_book', route: '/lessons', gradient: 'linear-gradient(135deg,#10b981,#34d399)' },
        { label: 'Multijoueur', icon: 'groups', route: '/multiplayer', gradient: 'linear-gradient(135deg,#a855f7,#7c3aed)' },
      ];
    }
    return [];
  }

  get profKpiCards(): KpiCard[] {
    const s = this.profStats();
    if (!s) return [];
    return [
      { label: 'Élèves inscrits', value: s.studentCount },
      { label: 'Élèves actifs', value: s.activeStudents },
    ];
  }

  get schoolKpiCards(): KpiCard[] {
    const s = this.schoolStats();
    if (!s) return [];
    return [
      { label: 'Élèves inscrits', value: s.studentCount },
      { label: 'Élèves actifs', value: s.activeStudents },
      { label: 'Professeurs', value: s.professorCount },
    ];
  }

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
    if (this.auth.isSchool()) {
      await this._loadSchoolStats();
      this.stats.set({
        totalUsers: 0, activeUsers: 0, totalLessons: 0, totalQuizQuestions: 0,
        totalStories: 0, unreadMessages: 0, multiplayerRooms: 0, totalSchools: 0,
        usersByLevel: {}, lessonsByCategory: {}
      });
      this.loading.set(false);
      return;
    }
    if (this.auth.isProf()) {
      await this._loadProfStats();
      this.stats.set({
        totalUsers: 0, activeUsers: 0, totalLessons: 0, totalQuizQuestions: 0,
        totalStories: 0, unreadMessages: 0, multiplayerRooms: 0, totalSchools: 0,
        usersByLevel: {}, lessonsByCategory: {}
      });
      this.loading.set(false);
      return;
    }
    if (!this.auth.isAdmin()) {
      this.stats.set({
        totalUsers: 0, activeUsers: 0, totalLessons: 0, totalQuizQuestions: 0,
        totalStories: 0, unreadMessages: 0, multiplayerRooms: 0, totalSchools: 0,
        usersByLevel: {}, lessonsByCategory: {}
      });
      this.loading.set(false);
      return;
    }
    
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

  private async _loadProfStats(): Promise<void> {
    try {
      const students = await this.api.get<AdminUserOut[]>('/prof/students');
      this.profStats.set({
        studentCount: students.length,
        activeStudents: students.filter(s => s.isActive).length,
      });
    } catch {
      this.profStats.set({ studentCount: 0, activeStudents: 0 });
    }
  }

  private async _loadSchoolStats(): Promise<void> {
    try {
      const [students, professors] = await Promise.all([
        this.api.get<AdminUserOut[]>('/school/students'),
        this.api.get<AdminUserOut[]>('/school/professors'),
      ]);
      this.schoolStats.set({
        studentCount: students.length,
        professorCount: professors.length,
        activeStudents: students.filter(s => s.isActive).length,
      });
    } catch {
      this.schoolStats.set({ studentCount: 0, professorCount: 0, activeStudents: 0 });
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
