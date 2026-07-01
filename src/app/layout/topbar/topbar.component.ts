import { Component, inject, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';

import { AdminAuthService } from '../../core/auth/admin-auth.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [MatToolbarModule, MatButtonModule, MatIconModule],
  template: `
    <mat-toolbar color="primary">
      <button mat-icon-button type="button" (click)="menuClick.emit()">
        <mat-icon>menu</mat-icon>
      </button>
      <span class="title">DELFy — Admin</span>
      <span class="spacer"></span>
      @if (auth.user(); as u) {
        <span class="email">{{ u.email }}</span>
      }
      <button mat-icon-button type="button" (click)="auth.logout()" title="Déconnexion">
        <mat-icon>logout</mat-icon>
      </button>
    </mat-toolbar>
  `,
  styles: [
    `
      .spacer {
        flex: 1 1 auto;
      }
      .title {
        margin-left: 0.5rem;
        font-size: 1.1rem;
      }
      .email {
        font-size: 0.9rem;
        margin-right: 0.5rem;
        max-width: 200px;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    `,
  ],
})
export class TopbarComponent {
  readonly auth = inject(AdminAuthService);
  readonly menuClick = output<void>();
}
