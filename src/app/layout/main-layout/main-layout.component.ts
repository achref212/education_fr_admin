import { Component, HostListener, inject, OnInit, OnDestroy } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { animate, style, transition, trigger } from '@angular/animations';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { AdminAuthService } from '../../core/auth/admin-auth.service';
import { ThemeService } from '../../core/theme/theme.service';
import { ChangePasswordDialogComponent } from '../../shared/change-password-dialog/change-password-dialog.component';

interface NavItem {
  label: string;
  path: string;
  icon: string;
  gradient: string;
  adminOnly?: boolean;
  schoolOnly?: boolean;
  profOnly?: boolean;
}

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [MatIconModule, RouterLink, RouterLinkActive, RouterOutlet, MatDialogModule],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss',
  animations: [
    trigger('fadeLabel', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-8px)' }),
        animate('200ms 100ms ease-out', style({ opacity: 1, transform: 'none' })),
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ opacity: 0 })),
      ]),
    ]),
  ],
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  private readonly auth   = inject(AdminAuthService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  readonly theme = inject(ThemeService);
  private _sub?: Subscription;

  sidebarCollapsed = false;
  mobileNavOpen = false;
  currentPageTitle = 'Tableau de bord';
  currentTime = '';
  currentDate = '';
  private _timer?: ReturnType<typeof setInterval>;

  get filteredNav(): NavItem[] {
    const role = this.auth.user()?.role;
    if (role === 'admin') {
      return this.nav.filter(n => !n.schoolOnly && !n.profOnly);
    }
    if (role === 'school') {
      return this.nav.filter(n => n.schoolOnly || n.path === '/dashboard');
    }
    if (role === 'prof') {
      return this.nav.filter(n => n.profOnly || n.path === '/dashboard' || (!n.adminOnly && !n.schoolOnly && ['Leçons', 'Multijoueur', 'Élèves'].includes(n.label)));
    }
    return [];
  }

  get userName(): string {
    const u = this.auth.user();
    if (!u) return 'Utilisateur';
    if (u.role === 'school') return u.name || 'École';
    return `${u.firstName} ${u.lastName}`;
  }

  get userRole(): string {
    return this.auth.user()?.role || 'admin';
  }

  get displayRole(): string {
    const role = this.auth.user()?.role;
    if (role === 'school') return 'Établissement';
    if (role === 'prof') return 'Professeur';
    return 'Administrateur';
  }

  get roleIcon(): string {
    const role = this.auth.user()?.role;
    if (role === 'school') return 'school';
    if (role === 'prof') return 'co_present';
    return 'admin_panel_settings';
  }

  get roleAccent(): string {
    const role = this.auth.user()?.role;
    if (role === 'school') return 'var(--role-school)';
    if (role === 'prof') return 'var(--role-prof)';
    return 'var(--role-admin)';
  }

  get userInitials(): string {
    const words = this.userName.trim().split(/\s+/).filter(Boolean);
    return words.slice(0, 2).map(word => word.charAt(0).toUpperCase()).join('') || 'D';
  }

  readonly nav: NavItem[] = [
    { label: 'Tableau de bord', path: '/dashboard',        icon: 'dashboard',       gradient: 'linear-gradient(135deg,#6366f1,#8b5cf6)' },
    { label: 'Élèves',          path: '/students',         icon: 'school',          gradient: 'linear-gradient(135deg,#10b981,#06b6d4)', schoolOnly: true },
    { label: 'Professeurs',     path: '/professors',       icon: 'badge',           gradient: 'linear-gradient(135deg,#6366f1,#a855f7)', schoolOnly: true },
    { label: 'Élèves',          path: '/users',             icon: 'people',          gradient: 'linear-gradient(135deg,#6366f1,#8b5cf6)', profOnly: true },
    { label: 'Utilisateurs',    path: '/users',             icon: 'people',          gradient: 'linear-gradient(135deg,#06b6d4,#3b82f6)' },
    { label: 'Leçons',          path: '/lessons',           icon: 'menu_book',       gradient: 'linear-gradient(135deg,#10b981,#34d399)' },
    { label: 'Quiz',            path: '/quiz-questions',    icon: 'quiz',            gradient: 'linear-gradient(135deg,#f59e0b,#fbbf24)' },
    { label: 'Histoires',       path: '/stories',           icon: 'auto_stories',    gradient: 'linear-gradient(135deg,#ec4899,#f43f5e)' },
    { label: 'Progression',     path: '/progress',          icon: 'trending_up',     gradient: 'linear-gradient(135deg,#10b981,#06b6d4)' },
    { label: 'Parcours DELF',   path: '/learning-paths',  icon: 'route',           gradient: 'linear-gradient(135deg,#6366f1,#06b6d4)', adminOnly: true },
    { label: 'Tests DELF',      path: '/delf-tests',      icon: 'assignment',      gradient: 'linear-gradient(135deg,#6366f1,#ec4899)', adminOnly: true },
    { label: 'Jeux',            path: '/games',             icon: 'sports_esports',  gradient: 'linear-gradient(135deg,#a855f7,#7c3aed)', adminOnly: true },
    { label: 'Messages',        path: '/contact-messages',  icon: 'mail',            gradient: 'linear-gradient(135deg,#f97316,#fb923c)' },
    { label: 'Multijoueur',     path: '/multiplayer',       icon: 'groups',          gradient: 'linear-gradient(135deg,#a855f7,#7c3aed)' },
    { label: 'Établissements',  path: '/schools',           icon: 'school',          gradient: 'linear-gradient(135deg,#10b981,#06b6d4)', adminOnly: true },
    { label: 'Aperçu App',      path: '/app-preview',       icon: 'smartphone',      gradient: 'linear-gradient(135deg,#007AFF,#6366f1)', adminOnly: true },
  ];

  ngOnInit(): void {
    this._updateDateTime();
    this._timer = setInterval(() => this._updateDateTime(), 30_000);

    this._sub = this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => {
        this._syncTitle();
        this.closeMobileNav();
      });
    this._syncTitle();

    if (this.auth.user()?.mustChangePassword) {
      this.dialog.open(ChangePasswordDialogComponent, {
        disableClose: true,
        width: '400px',
      });
    }
  }

  ngOnDestroy(): void {
    clearInterval(this._timer);
    this._sub?.unsubscribe();
  }

  toggleSidebar(): void {
    if (window.matchMedia('(max-width: 1024px)').matches) {
      this.sidebarCollapsed = false;
      this.mobileNavOpen = !this.mobileNavOpen;
      return;
    }
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  closeMobileNav(): void {
    this.mobileNavOpen = false;
  }

  logout(): void {
    this.auth.logout();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeMobileNav();
  }

  @HostListener('window:resize')
  onResize(): void {
    if (!window.matchMedia('(max-width: 1024px)').matches) {
      this.closeMobileNav();
    }
  }

  private _updateDateTime(): void {
    this.currentTime = new Date().toLocaleTimeString('fr-FR', {
      hour: '2-digit', minute: '2-digit',
    });
    this.currentDate = new Date().toLocaleDateString('fr-FR', {
      weekday: 'short', day: 'numeric', month: 'short',
    });
  }

  private _syncTitle(): void {
    const url = this.router.url;
    if (url.startsWith('/profile')) {
      this.currentPageTitle = 'Mon profil';
      return;
    }
    if (url.startsWith('/app-preview')) {
      this.currentPageTitle = 'Aperçu de l\'application';
      return;
    }
    const match = this.filteredNav.find(n => url.startsWith(n.path));
    this.currentPageTitle = match?.label ?? 'Administration';
  }
}
