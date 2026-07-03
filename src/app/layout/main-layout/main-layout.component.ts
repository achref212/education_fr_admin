import { Component, inject, OnInit, OnDestroy } from '@angular/core';
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
  currentPageTitle = 'Tableau de bord';
  currentTime = '';
  private _timer?: ReturnType<typeof setInterval>;

  get filteredNav(): NavItem[] {
    const role = this.auth.user()?.role;
    if (role === 'admin') {
      return this.nav;
    }
    if (role === 'school') {
      return this.nav.filter(n => ['Tableau de bord', 'Utilisateurs'].includes(n.label));
    }
    if (role === 'prof') {
      return this.nav.filter(n => ['Tableau de bord', 'Utilisateurs', 'Leçons', 'Multijoueur'].includes(n.label));
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

  readonly nav: NavItem[] = [
    { label: 'Tableau de bord', path: '/dashboard',        icon: 'dashboard',       gradient: 'linear-gradient(135deg,#6366f1,#8b5cf6)' },
    { label: 'Utilisateurs',    path: '/users',             icon: 'people',          gradient: 'linear-gradient(135deg,#06b6d4,#3b82f6)' },
    { label: 'Leçons',          path: '/lessons',           icon: 'menu_book',       gradient: 'linear-gradient(135deg,#10b981,#34d399)' },
    { label: 'Quiz',            path: '/quiz-questions',    icon: 'quiz',            gradient: 'linear-gradient(135deg,#f59e0b,#fbbf24)' },
    { label: 'Histoires',       path: '/stories',           icon: 'auto_stories',    gradient: 'linear-gradient(135deg,#ec4899,#f43f5e)' },
    { label: 'Progression',     path: '/progress',          icon: 'trending_up',     gradient: 'linear-gradient(135deg,#10b981,#06b6d4)' },
    { label: 'Messages',        path: '/contact-messages',  icon: 'mail',            gradient: 'linear-gradient(135deg,#f97316,#fb923c)' },
    { label: 'Multijoueur',     path: '/multiplayer',       icon: 'groups',          gradient: 'linear-gradient(135deg,#a855f7,#7c3aed)' },
  ];

  ngOnInit(): void {
    this._updateTime();
    this._timer = setInterval(() => this._updateTime(), 1000);

    this._sub = this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => this._syncTitle());
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
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  logout(): void {
    this.auth.logout();
  }

  private _updateTime(): void {
    this.currentTime = new Date().toLocaleTimeString('fr-FR', {
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
  }

  private _syncTitle(): void {
    const url = this.router.url;
    const match = this.nav.find(n => url.startsWith(n.path));
    this.currentPageTitle = match?.label ?? 'Administration';
  }
}
