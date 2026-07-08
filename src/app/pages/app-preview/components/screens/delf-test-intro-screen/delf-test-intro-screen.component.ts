import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { NgClass } from '@angular/common';

import { PreviewTheme } from '../../../models/app-preview-step.model';

@Component({
  selector: 'app-delf-test-intro-screen',
  standalone: true,
  imports: [MatIconModule, NgClass],
  templateUrl: './delf-test-intro-screen.component.html',
  styleUrl: './delf-test-intro-screen.component.scss',
})
export class DelfTestIntroScreenComponent {
  @Input({ required: true }) theme: PreviewTheme = 'light';
}
