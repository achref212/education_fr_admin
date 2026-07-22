import { Routes } from '@angular/router';

import { adminAuthGuard, adminRoleGuard, loginPageGuard, schoolRoleGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'copy',
    loadComponent: () =>
      import('./pages/copy/copy.component').then((m) => m.CopyComponent),
  },
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
        path: 'students',
        canActivate: [schoolRoleGuard],
        loadComponent: () =>
          import('./pages/school-students/school-students.component').then(
            (m) => m.SchoolStudentsComponent,
          ),
      },
      {
        path: 'professors',
        canActivate: [schoolRoleGuard],
        loadComponent: () =>
          import('./pages/school-professors/school-professors.component').then(
            (m) => m.SchoolProfessorsComponent,
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
      {
        path: 'learning-paths',
        loadComponent: () =>
          import('./pages/learning-paths/learning-paths.component').then(
            (m) => m.LearningPathsComponent,
          ),
      },
      {
        path: 'games',
        loadComponent: () =>
          import('./pages/games/games.component').then(
            (m) => m.GamesComponent,
          ),
      },
      {
        path: 'delf-tests',
        loadComponent: () =>
          import('./pages/delf-tests/delf-tests.component').then(
            (m) => m.DelfTestsComponent,
          ),
      },
      {
        path: 'ai-delf-assistant',
        canActivate: [adminRoleGuard],
        loadComponent: () =>
          import('./pages/ai-delf-assistant/ai-delf-assistant.component').then(
            (m) => m.AiDelfAssistantComponent,
          ),
      },
      {
        path: 'assets',
        canActivate: [adminRoleGuard],
        loadComponent: () =>
          import('./pages/assets/assets.component').then(
            (m) => m.AssetsComponent,
          ),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./pages/profile/profile.component').then(
            (m) => m.ProfileComponent,
          ),
      },
      {
        path: 'schools',
        loadComponent: () =>
          import('./pages/schools/schools.component').then(
            (m) => m.SchoolsComponent,
          ),
      },
      {
        path: 'app-preview',
        canActivate: [adminRoleGuard],
        loadComponent: () =>
          import('./pages/app-preview/app-preview.component').then(
            (m) => m.AppPreviewComponent,
          ),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
