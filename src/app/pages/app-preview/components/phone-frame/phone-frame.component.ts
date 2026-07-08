import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';

import { PreviewTheme } from '../../models/app-preview-step.model';
import { PreviewBottomNavComponent } from '../preview-bottom-nav/preview-bottom-nav.component';

@Component({
  selector: 'app-phone-frame',
  standalone: true,
  imports: [NgClass, PreviewBottomNavComponent],
  templateUrl: './phone-frame.component.html',
  styleUrl: './phone-frame.component.scss',
})
export class PhoneFrameComponent {
  @Input({ required: true }) theme: PreviewTheme = 'light';
  @Input() bottomNavIndex: number | null = null;
  @Input() showBottomNav = true;
}
