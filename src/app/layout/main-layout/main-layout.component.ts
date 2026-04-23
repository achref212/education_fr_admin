import { Component, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { TopbarComponent } from '../topbar/topbar.component';

interface NavItem {
  label: string;
  path: string;
  icon: string;
}

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    MatSidenavModule,
    MatListModule,
    MatButtonModule,
    MatIconModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    TopbarComponent,
  ],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss',
})
export class MainLayoutComponent {
  @ViewChild('drawer') drawer?: MatSidenav;

  readonly nav: NavItem[] = [
    { label: 'Tableau de bord', path: '/dashboard', icon: 'dashboard' },
    { label: 'Utilisateurs', path: '/users', icon: 'people' },
    { label: 'Leçons', path: '/lessons', icon: 'menu_book' },
    { label: 'Quiz', path: '/quiz-questions', icon: 'quiz' },
    { label: 'Histoires', path: '/stories', icon: 'auto_stories' },
    { label: 'Progression', path: '/progress', icon: 'trending_up' },
    { label: 'Messages', path: '/contact-messages', icon: 'mail' },
    { label: 'Multijoueur', path: '/multiplayer', icon: 'groups' },
  ];

  onMenuClick(): void {
    this.drawer?.toggle();
  }
}
