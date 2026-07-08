import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { PreviewTheme } from '../../models/app-preview-step.model';

@Component({
  selector: 'app-preview-bottom-nav',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './preview-bottom-nav.component.html',
  styleUrl: './preview-bottom-nav.component.scss',
})
export class PreviewBottomNavComponent {
  @Input({ required: true }) activeIndex = 0;
  @Input({ required: true }) theme: PreviewTheme = 'light';

  readonly items = [
    { icon: 'home', label: 'Accueil' },
    { icon: 'emoji_events', label: 'Classement' },
    { icon: 'person', label: 'Profil' },
  ];
}
