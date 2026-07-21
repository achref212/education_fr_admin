import { DatePipe } from '@angular/common';
import { Component, effect, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ChartConfiguration } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

import { AdminStats } from '../../core/models/stats.model';
import { AdminUserOut } from '../../core/models/user.model';
import { ApiService } from '../../core/http/api.service';
import { StatCardComponent } from '../../shared/stat-card/stat-card.component';
import { AdminAuthService } from '../../core/auth/admin-auth.service';
import { ThemeService } from '../../core/theme/theme.service';

interface KpiCard {
  label: string;
  value: number | string;
  detail: string;
  icon: string;
  accent: string;
  status?: string;
  route?: string;
}

interface QuickAction {
  label: string;
  description: string;
  icon: string;
  route: string;
  accent: string;
}

interface ModuleCard extends QuickAction {
  count: () => number;
}

const CHART_COLORS = ['#6d5dfc', '#ec4899', '#16a67a', '#f59e0b', '#22b8cf', '#9b5de5', '#f97316', '#ef4444'];

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [MatIconModule, BaseChartDirective, StatCardComponent, RouterLink, DatePipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit, OnDestroy {
  private readonly api = inject(ApiService);
  readonly auth = inject(AdminAuthService);
  private readonly theme = inject(ThemeService);

  readonly loading = signal(true);
  readonly refreshing = signal(false);
  readonly error = signal('');
  readonly lastUpdated = signal<Date | null>(null);
  readonly stats = signal<AdminStats | null>(null);
  readonly students = signal<AdminUserOut[]>([]);
  readonly professors = signal<AdminUserOut[]>([]);
  readonly levelChart = signal<ChartConfiguration<'bar'>>(this.emptyBarChart());
  readonly statusChart = signal<ChartConfiguration<'doughnut'>>(this.emptyDoughnutChart());
  private refreshTimer?: number;
  private readonly refreshIntervalMs = 60_000;
  private readonly visibilityHandler = () => {
    if (document.visibilityState === 'visible' && this.shouldRefresh()) void this.loadDashboard(false);
  };

  constructor() {
    effect(() => {
      this.theme.isDark();
      const stats = this.stats();
      const students = this.students();
      this.professors();
      if (!this.loading()) {
        this.buildCharts(stats, students);
      }
    });
  }

  get userName(): string {
    const user = this.auth.user();
    if (!user) return 'Utilisateur';
    if (user.role === 'school') return user.name || 'Votre établissement';
    return `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || 'Utilisateur';
  }

  get roleLabel(): string {
    if (this.auth.isSchool()) return 'Établissement';
    if (this.auth.isProf()) return 'Professeur';
    return 'Administrateur';
  }

  get roleIcon(): string {
    if (this.auth.isSchool()) return 'school';
    if (this.auth.isProf()) return 'co_present';
    return 'admin_panel_settings';
  }

  get heroTitle(): string {
    if (this.auth.isSchool()) return 'Pilotez votre établissement avec clarté.';
    if (this.auth.isProf()) return 'Faites progresser chaque élève.';
    return 'Votre plateforme, en un seul regard.';
  }

  get heroDescription(): string {
    if (this.auth.isSchool()) return 'Suivez les effectifs, l’activité des élèves et votre équipe pédagogique depuis un espace unifié.';
    if (this.auth.isProf()) return 'Retrouvez vos élèves, préparez vos leçons et lancez des activités engageantes en quelques secondes.';
    return 'Surveillez l’activité, organisez les contenus pédagogiques et accédez rapidement aux opérations importantes.';
  }

  get healthRate(): number {
    const stats = this.stats();
    const students = this.students();
    const total = this.auth.isAdmin() ? stats?.totalUsers ?? 0 : students.length;
    const active = this.auth.isAdmin()
      ? stats?.activeUsers ?? 0
      : students.filter(student => student.isActive).length;
    return total === 0 ? 0 : Math.round((active / total) * 100);
  }

  get healthLabel(): string {
    return this.auth.isAdmin() ? 'Utilisateurs actifs' : 'Élèves actifs';
  }

  get healthStatus(): string {
    if (this.healthRate === 0) return 'Prêt à démarrer';
    if (this.healthRate >= 75) return 'Très bonne activité';
    if (this.healthRate >= 40) return 'Activité stable';
    return 'Activité à dynamiser';
  }

  get primaryAction(): QuickAction {
    if (this.auth.isSchool()) return this.schoolActions[0];
    if (this.auth.isProf()) return this.profActions[0];
    return this.adminActions[0];
  }

  get kpiCards(): KpiCard[] {
    const stats = this.stats();
    const students = this.students();
    const activeStudents = students.filter(student => student.isActive).length;
    const inactiveStudents = students.length - activeStudents;

    if (this.auth.isSchool()) {
      return [
        { label: 'Élèves inscrits', value: students.length, detail: 'Effectif total', icon: 'groups', accent: '#12b886', route: '/students' },
        { label: 'Élèves actifs', value: activeStudents, detail: `${this.healthRate}% de l’effectif`, icon: 'verified_user', accent: '#22b8cf', status: 'Actifs', route: '/students' },
        { label: 'Professeurs', value: this.professors().length, detail: 'Équipe pédagogique', icon: 'co_present', accent: '#6d5dfc', route: '/professors' },
        { label: 'À réactiver', value: inactiveStudents, detail: 'Comptes élèves inactifs', icon: 'person_off', accent: '#f59e0b', route: '/students' },
      ];
    }

    if (this.auth.isProf()) {
      return [
        { label: 'Mes élèves', value: students.length, detail: 'Élèves attribués', icon: 'groups', accent: '#6d5dfc', route: '/users' },
        { label: 'Élèves actifs', value: activeStudents, detail: `${this.healthRate}% de votre classe`, icon: 'how_to_reg', accent: '#16a67a', status: 'Actifs', route: '/users' },
        { label: 'À accompagner', value: inactiveStudents, detail: 'Comptes à réactiver', icon: 'support_agent', accent: '#f59e0b', route: '/users' },
      ];
    }

    if (!stats) return [];
    return [
      { label: 'Utilisateurs', value: stats.totalUsers, detail: 'Comptes sur la plateforme', icon: 'groups', accent: '#6d5dfc', route: '/users' },
      { label: 'Utilisateurs actifs', value: stats.activeUsers, detail: `${this.healthRate}% du total`, icon: 'verified_user', accent: '#22b8cf', status: 'Actifs', route: '/users' },
      { label: 'Établissements', value: stats.totalSchools, detail: 'Partenaires scolaires', icon: 'school', accent: '#16a67a', route: '/schools' },
      { label: 'Leçons', value: stats.totalLessons, detail: 'Contenus pédagogiques', icon: 'menu_book', accent: '#10b981', route: '/lessons' },
      { label: 'Questions quiz', value: stats.totalQuizQuestions, detail: 'Questions disponibles', icon: 'quiz', accent: '#f59e0b', route: '/quiz-questions' },
      { label: 'Histoires', value: stats.totalStories, detail: 'Lectures publiées', icon: 'auto_stories', accent: '#ec4899', route: '/stories' },
      { label: 'Messages non lus', value: stats.unreadMessages, detail: 'Demandes à traiter', icon: 'mark_email_unread', accent: '#f97316', status: stats.unreadMessages ? 'Action' : '', route: '/contact-messages' },
      { label: 'Salles multijoueur', value: stats.multiplayerRooms, detail: 'Sessions créées', icon: 'stadia_controller', accent: '#9b5de5', route: '/multiplayer' },
    ];
  }

  get chartTitle(): string {
    return this.auth.isAdmin() ? 'Utilisateurs par niveau' : 'Élèves par classe';
  }

  get chartSubtitle(): string {
    return this.auth.isAdmin() ? 'Répartition des apprenants inscrits' : 'Répartition actuelle de votre effectif';
  }

  get statusChartTitle(): string {
    return this.auth.isAdmin() ? 'Leçons par catégorie' : 'État des comptes élèves';
  }

  get statusChartSubtitle(): string {
    return this.auth.isAdmin() ? 'Équilibre des contenus pédagogiques' : 'Comptes actifs et comptes à réactiver';
  }

  get aiProviderSummary(): string {
    return 'Hugging Face Qwen en principal, NVIDIA Llama en secours';
  }

  get hasLevelData(): boolean {
    return (this.levelChart().data.labels?.length ?? 0) > 0;
  }

  get hasStatusData(): boolean {
    return (this.statusChart().data.labels?.length ?? 0) > 0;
  }

  get levelBreakdown(): Array<{ label: string; value: number; color: string }> {
    const values = this.auth.isAdmin()
      ? this.stats()?.usersByLevel ?? {}
      : this.groupStudentsByLevel(this.students());
    return Object.entries(values)
      .filter(([, value]) => value > 0)
      .sort(([left], [right]) => left.localeCompare(right, 'fr'))
      .map(([label, value], index) => ({ label, value, color: CHART_COLORS[index % CHART_COLORS.length] }));
  }

  get statusBreakdown(): Array<{ label: string; value: number; color: string }> {
    const students = this.students();
    const values = this.auth.isAdmin()
      ? this.stats()?.lessonsByCategory ?? {}
      : {
          Actifs: students.filter(student => student.isActive).length,
          Inactifs: students.filter(student => !student.isActive).length,
        };
    return Object.entries(values)
      .filter(([, value]) => value > 0)
      .map(([label, value], index) => ({ label, value, color: CHART_COLORS[index % CHART_COLORS.length] }));
  }

  private readonly adminModules: ModuleCard[] = [
    { label: 'Utilisateurs', description: 'Gérer les comptes, rôles, niveaux et statuts.', icon: 'groups', route: '/users', accent: '#6d5dfc', count: () => this.stats()?.totalUsers ?? 0 },
    { label: 'Leçons', description: 'Créer et organiser les contenus pédagogiques.', icon: 'menu_book', route: '/lessons', accent: '#16a67a', count: () => this.stats()?.totalLessons ?? 0 },
    { label: 'Quiz', description: 'Construire des évaluations avec explications.', icon: 'quiz', route: '/quiz-questions', accent: '#f59e0b', count: () => this.stats()?.totalQuizQuestions ?? 0 },
    { label: 'Histoires', description: 'Publier des lectures adaptées à chaque niveau.', icon: 'auto_stories', route: '/stories', accent: '#ec4899', count: () => this.stats()?.totalStories ?? 0 },
    { label: 'Établissements', description: 'Administrer les écoles partenaires.', icon: 'school', route: '/schools', accent: '#22b8cf', count: () => this.stats()?.totalSchools ?? 0 },
    { label: 'Messages', description: 'Répondre aux demandes des utilisateurs.', icon: 'forum', route: '/contact-messages', accent: '#f97316', count: () => this.stats()?.unreadMessages ?? 0 },
    { label: 'Multijoueur', description: 'Superviser les salles et les sessions de jeu.', icon: 'sports_esports', route: '/multiplayer', accent: '#9b5de5', count: () => this.stats()?.multiplayerRooms ?? 0 },
    { label: 'Parcours DELF', description: 'Structurer les étapes et objectifs DELF.', icon: 'route', route: '/learning-paths', accent: '#3b82f6', count: () => 0 },
    { label: 'Assistant IA DELF', description: 'Générer des brouillons de questions, tests et leçons.', icon: 'auto_awesome', route: '/ai-delf-assistant', accent: '#16a67a', count: () => 0 },
  ];

  private readonly schoolModules: ModuleCard[] = [
    { label: 'Élèves', description: 'Consulter les classes, profils et parcours DELF.', icon: 'groups', route: '/students', accent: '#12b886', count: () => this.students().length },
    { label: 'Professeurs', description: 'Créer et gérer votre équipe pédagogique.', icon: 'co_present', route: '/professors', accent: '#6d5dfc', count: () => this.professors().length },
  ];

  private readonly profModules: ModuleCard[] = [
    { label: 'Mes élèves', description: 'Suivre chaque élève et son parcours détaillé.', icon: 'groups', route: '/users', accent: '#6d5dfc', count: () => this.students().length },
    { label: 'Leçons', description: 'Préparer des leçons adaptées à vos classes.', icon: 'menu_book', route: '/lessons', accent: '#16a67a', count: () => 0 },
    { label: 'Multijoueur', description: 'Lancer des défis et quiz collectifs.', icon: 'sports_esports', route: '/multiplayer', accent: '#9b5de5', count: () => 0 },
  ];

  private readonly adminActions: QuickAction[] = [
    { label: 'Créer une leçon', description: 'Ajouter un nouveau contenu', icon: 'add_box', route: '/lessons', accent: '#16a67a' },
    { label: 'Gérer les élèves', description: 'Comptes et progression', icon: 'manage_accounts', route: '/users', accent: '#6d5dfc' },
    { label: 'Voir les messages', description: 'Demandes en attente', icon: 'mark_email_unread', route: '/contact-messages', accent: '#f97316' },
    { label: 'Configurer DELF', description: 'Parcours et évaluations', icon: 'route', route: '/learning-paths', accent: '#3b82f6' },
    { label: 'Assistant IA', description: 'Générer du contenu DELF', icon: 'auto_awesome', route: '/ai-delf-assistant', accent: '#16a67a' },
  ];

  private readonly schoolActions: QuickAction[] = [
    { label: 'Voir les élèves', description: 'Classes et progression', icon: 'groups', route: '/students', accent: '#12b886' },
    { label: 'Ajouter un professeur', description: 'Développer votre équipe', icon: 'person_add', route: '/professors', accent: '#6d5dfc' },
  ];

  private readonly profActions: QuickAction[] = [
    { label: 'Voir mes élèves', description: 'Profils et parcours', icon: 'groups', route: '/users', accent: '#6d5dfc' },
    { label: 'Créer une leçon', description: 'Préparer un contenu', icon: 'note_add', route: '/lessons', accent: '#16a67a' },
    { label: 'Lancer une partie', description: 'Défi multijoueur', icon: 'sports_esports', route: '/multiplayer', accent: '#9b5de5' },
  ];

  get modules(): ModuleCard[] {
    if (this.auth.isSchool()) return this.schoolModules;
    if (this.auth.isProf()) return this.profModules;
    return this.adminModules;
  }

  get quickActions(): QuickAction[] {
    if (this.auth.isSchool()) return this.schoolActions;
    if (this.auth.isProf()) return this.profActions;
    return this.adminActions;
  }

  async ngOnInit(): Promise<void> {
    await this.loadDashboard(true);
    this.refreshTimer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void this.loadDashboard(false);
    }, this.refreshIntervalMs);
    document.addEventListener('visibilitychange', this.visibilityHandler);
  }

  ngOnDestroy(): void {
    if (this.refreshTimer !== undefined) window.clearInterval(this.refreshTimer);
    document.removeEventListener('visibilitychange', this.visibilityHandler);
  }

  async loadDashboard(showLoader = false): Promise<void> {
    if ((this.loading() && !showLoader) || this.refreshing()) return;
    if (showLoader) this.loading.set(true);
    else this.refreshing.set(true);
    this.error.set('');

    try {
      if (this.auth.isSchool()) {
        const [students, professors] = await Promise.all([
          this.api.get<AdminUserOut[]>('/school/students'),
          this.api.get<AdminUserOut[]>('/school/professors'),
        ]);
        this.students.set(students);
        this.professors.set(professors);
      } else if (this.auth.isProf()) {
        this.students.set(await this.api.get<AdminUserOut[]>('/prof/students'));
      } else if (this.auth.isAdmin()) {
        this.stats.set(this.normalizeStats(await this.api.get<AdminStats>('/admin/stats')));
      } else {
        throw new Error('Vous n’avez pas accès à ce tableau de bord.');
      }
      this.lastUpdated.set(new Date());
    } catch (error: unknown) {
      if (!this.hasDashboardData()) {
        this.error.set(error instanceof Error ? error.message : 'Impossible de charger le tableau de bord.');
      }
    } finally {
      this.loading.set(false);
      this.refreshing.set(false);
    }
  }

  private hasDashboardData(): boolean {
    return this.stats() !== null || this.students().length > 0 || this.professors().length > 0;
  }

  private shouldRefresh(): boolean {
    const updated = this.lastUpdated();
    return !updated || Date.now() - updated.getTime() >= this.refreshIntervalMs;
  }

  private normalizeStats(stats: AdminStats): AdminStats {
    return {
      totalUsers: Number(stats.totalUsers) || 0,
      activeUsers: Number(stats.activeUsers) || 0,
      totalLessons: Number(stats.totalLessons) || 0,
      totalQuizQuestions: Number(stats.totalQuizQuestions) || 0,
      totalStories: Number(stats.totalStories) || 0,
      unreadMessages: Number(stats.unreadMessages) || 0,
      multiplayerRooms: Number(stats.multiplayerRooms) || 0,
      totalSchools: Number(stats.totalSchools) || 0,
      usersByLevel: stats.usersByLevel ?? {},
      lessonsByCategory: stats.lessonsByCategory ?? {},
    };
  }

  private buildCharts(stats: AdminStats | null, students: AdminUserOut[]): void {
    if (this.auth.isAdmin() && stats) {
      this.levelChart.set(this.createBarChart(stats.usersByLevel, 'Utilisateurs'));
      this.statusChart.set(this.createDoughnutChart(stats.lessonsByCategory));
      return;
    }

    this.levelChart.set(this.createBarChart(this.groupStudentsByLevel(students), 'Élèves'));
    this.statusChart.set(students.length
      ? this.createDoughnutChart({
          Actifs: students.filter(student => student.isActive).length,
          Inactifs: students.filter(student => !student.isActive).length,
        }, ['#16a67a', '#f59e0b'])
      : this.emptyDoughnutChart());
  }

  private groupStudentsByLevel(students: AdminUserOut[]): Record<string, number> {
    return students.reduce<Record<string, number>>((groups, student) => {
      const level = student.classLevel || student.level || 'Non renseigné';
      groups[level] = (groups[level] ?? 0) + 1;
      return groups;
    }, {});
  }

  private createBarChart(values: Record<string, number>, datasetLabel: string): ChartConfiguration<'bar'> {
    const labels = Object.keys(values).sort((a, b) => a.localeCompare(b, 'fr'));
    const colors = this.chartTheme();
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    return {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: datasetLabel,
          data: labels.map(label => values[label]),
          backgroundColor: labels.map((_, index) => `${CHART_COLORS[index % CHART_COLORS.length]}cc`),
          borderColor: labels.map((_, index) => CHART_COLORS[index % CHART_COLORS.length]),
          borderWidth: 1,
          borderRadius: 9,
          borderSkipped: false,
          maxBarThickness: 44,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: reducedMotion ? 0 : 650 },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: colors.tooltip,
            titleColor: colors.text,
            bodyColor: colors.label,
            padding: 12,
            cornerRadius: 10,
            displayColors: false,
          },
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: colors.label, font: { size: 11, weight: 600 } }, border: { display: false } },
          y: { beginAtZero: true, grid: { color: colors.grid }, ticks: { color: colors.label, precision: 0 }, border: { display: false } },
        },
      },
    };
  }

  private createDoughnutChart(values: Record<string, number>, palette = CHART_COLORS): ChartConfiguration<'doughnut'> {
    const labels = Object.keys(values).filter(label => values[label] > 0);
    const colors = this.chartTheme();
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    return {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data: labels.map(label => values[label]),
          backgroundColor: labels.map((_, index) => `${palette[index % palette.length]}dd`),
          borderColor: labels.map((_, index) => palette[index % palette.length]),
          borderWidth: 2,
          hoverOffset: reducedMotion ? 0 : 7,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: reducedMotion ? 0 : 650 },
        cutout: '70%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: colors.label, padding: 18, usePointStyle: true, pointStyle: 'circle', font: { size: 11, weight: 600 } },
          },
          tooltip: {
            backgroundColor: colors.tooltip,
            titleColor: colors.text,
            bodyColor: colors.label,
            padding: 12,
            cornerRadius: 10,
          },
        },
      },
    };
  }

  private chartTheme(): { grid: string; label: string; text: string; tooltip: string } {
    const styles = getComputedStyle(document.documentElement);
    return {
      grid: styles.getPropertyValue('--clr-chart-grid').trim(),
      label: styles.getPropertyValue('--clr-chart-label').trim(),
      text: styles.getPropertyValue('--clr-text').trim(),
      tooltip: styles.getPropertyValue('--clr-surface-elevated').trim(),
    };
  }

  private emptyBarChart(): ChartConfiguration<'bar'> {
    return { type: 'bar', data: { labels: [], datasets: [] }, options: { responsive: true, maintainAspectRatio: false } };
  }

  private emptyDoughnutChart(): ChartConfiguration<'doughnut'> {
    return { type: 'doughnut', data: { labels: [], datasets: [] }, options: { responsive: true, maintainAspectRatio: false } };
  }
}
