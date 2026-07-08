import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { NgClass } from '@angular/common';

import { PreviewTheme } from '../../../models/app-preview-step.model';

@Component({
  selector: 'app-delf-test-result-screen',
  standalone: true,
  imports: [MatIconModule, NgClass],
  templateUrl: './delf-test-result-screen.component.html',
  styleUrl: './delf-test-result-screen.component.scss',
})
export class DelfTestResultScreenComponent {
  @Input({ required: true }) theme: PreviewTheme = 'light';

  readonly categories = [
    { name: 'Grammaire', score: 82 },
    { name: 'Conjugaison', score: 75 },
    { name: 'Orthographe', score: 68 },
    { name: 'Vocabulaire', score: 88 },
    { name: 'Lecture', score: 79 },
    { name: 'Dictée', score: 71 },
  ];
}
