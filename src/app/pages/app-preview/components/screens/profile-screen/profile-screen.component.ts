import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

import { PreviewTheme } from '../../../models/app-preview-step.model';

@Component({
  selector: 'app-profile-screen',
  standalone: true,
  imports: [MatIconModule, NgClass],
  templateUrl: './profile-screen.component.html',
  styleUrl: './profile-screen.component.scss',
})
export class ProfileScreenComponent {
  @Input({ required: true }) theme: PreviewTheme = 'light';
}
