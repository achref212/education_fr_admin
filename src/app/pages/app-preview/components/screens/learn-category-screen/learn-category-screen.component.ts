import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { NgClass } from '@angular/common';

import { PreviewTheme } from '../../../models/app-preview-step.model';

interface LessonItem {
  title: string;
  duration: string;
  progress: number;
  locked: boolean;
}

@Component({
  selector: 'app-learn-category-screen',
  standalone: true,
  imports: [MatIconModule, NgClass],
  templateUrl: './learn-category-screen.component.html',
  styleUrl: './learn-category-screen.component.scss',
})
export class LearnCategoryScreenComponent {
  @Input({ required: true }) theme: PreviewTheme = 'light';

  readonly lessons: LessonItem[] = [
    { title: 'Les articles définis', duration: '8 min', progress: 100, locked: false },
    { title: 'Les verbes en -er', duration: '12 min', progress: 60, locked: false },
    { title: 'Le présent de l\'indicatif', duration: '10 min', progress: 0, locked: false },
    { title: 'Les pronoms sujets', duration: '9 min', progress: 0, locked: true },
    { title: 'La négation', duration: '11 min', progress: 0, locked: true },
  ];
}
