import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { NgClass } from '@angular/common';

import { PreviewTheme } from '../../../models/app-preview-step.model';

@Component({
  selector: 'app-delf-test-question-screen',
  standalone: true,
  imports: [MatIconModule, NgClass],
  templateUrl: './delf-test-question-screen.component.html',
  styleUrl: './delf-test-question-screen.component.scss',
})
export class DelfTestQuestionScreenComponent {
  @Input({ required: true }) theme: PreviewTheme = 'light';

  readonly options = ['allons', 'sommes allés', 'allions', 'irons'];
  readonly letters = ['A', 'B', 'C', 'D'];
}
