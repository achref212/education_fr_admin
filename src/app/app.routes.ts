import { Routes } from '@angular/router';

import { adminAuthGuard, loginPageGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [loginPageGuard],
    loadComponent: () =>
      import('./pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    canActivate: [adminAuthGuard],
    loadComponent: () =>
      import('./layout/main-layout/main-layout.component').then(
        (m) => m.MainLayoutComponent,
      ),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent,
          ),
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./pages/users/users.component').then((m) => m.UsersComponent),
      },
      {
        path: 'lessons',
        loadComponent: () =>
          import('./pages/lessons/lessons.component').then(
            (m) => m.LessonsComponent,
          ),
      },
      {
        path: 'quiz-questions',
        loadComponent: () =>
          import('./pages/quiz-questions/quiz-questions.component').then(
            (m) => m.QuizQuestionsComponent,
          ),
      },
      {
        path: 'stories',
        loadComponent: () =>
          import('./pages/stories/stories.component').then(
            (m) => m.StoriesComponent,
          ),
      },
      {
        path: 'progress',
        loadComponent: () =>
          import('./pages/progress/progress.component').then(
            (m) => m.ProgressComponent,
          ),
      },
      {
        path: 'contact-messages',
        loadComponent: () =>
          import('./pages/contact-messages/contact-messages.component').then(
            (m) => m.ContactMessagesComponent,
          ),
      },
      {
        path: 'multiplayer',
        loadComponent: () =>
          import('./pages/multiplayer/multiplayer.component').then(
            (m) => m.MultiplayerComponent,
          ),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
