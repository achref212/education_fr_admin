import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { NgClass } from '@angular/common';

import { PreviewTheme } from '../../../models/app-preview-step.model';

@Component({
  selector: 'app-learn-lesson-screen',
  standalone: true,
  imports: [MatIconModule, NgClass],
  templateUrl: './learn-lesson-screen.component.html',
  styleUrl: './learn-lesson-screen.component.scss',
})
export class LearnLessonScreenComponent {
  @Input({ required: true }) theme: PreviewTheme = 'light';
}
