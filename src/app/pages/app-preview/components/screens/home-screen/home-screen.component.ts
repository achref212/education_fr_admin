import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { NgClass } from '@angular/common';

import { PreviewTheme } from '../../../models/app-preview-step.model';

@Component({
  selector: 'app-home-screen',
  standalone: true,
  imports: [MatIconModule, NgClass],
  templateUrl: './home-screen.component.html',
  styleUrl: './home-screen.component.scss',
})
export class HomeScreenComponent {
  @Input({ required: true }) theme: PreviewTheme = 'light';
  @Input() variant: 'initial' | 'return' = 'initial';

  readonly categories = [
    { title: 'Grammaire', icon: 'rule', color: '#007AFF' },
    { title: 'Conjugaison', icon: 'schedule', color: '#FF9500' },
    { title: 'Orthographe', icon: 'spellcheck', color: '#AF52DE' },
    { title: 'Vocabulaire', icon: 'translate', color: '#34C759' },
    { title: 'Lecture', icon: 'auto_stories', color: '#5AC8FA' },
    { title: 'Dictée', icon: 'edit_note', color: '#FF3B30' },
  ];

  get streak(): number {
    return this.variant === 'return' ? 5 : 2;
  }

  get progressPercent(): number {
    return this.variant === 'return' ? 72 : 65;
  }

  get lessonsThisWeek(): number {
    return this.variant === 'return' ? 16 : 14;
  }

  get dailyGoalTitle(): string {
    return this.variant === 'return'
      ? 'Vocabulaire : Les animaux'
      : 'Grammaire : Les verbes en -er';
  }
}
