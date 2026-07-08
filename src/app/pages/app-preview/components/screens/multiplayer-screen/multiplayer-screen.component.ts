import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { NgClass } from '@angular/common';

import { PreviewTheme } from '../../../models/app-preview-step.model';

interface RoomItem {
  name: string;
  code: string;
  players: number;
  maxPlayers: number;
}

@Component({
  selector: 'app-multiplayer-screen',
  standalone: true,
  imports: [MatIconModule, NgClass],
  templateUrl: './multiplayer-screen.component.html',
  styleUrl: './multiplayer-screen.component.scss',
})
export class MultiplayerScreenComponent {
  @Input({ required: true }) theme: PreviewTheme = 'light';

  readonly rooms: RoomItem[] = [
    { name: 'Salle Prof. Martin', code: 'DELF42', players: 3, maxPlayers: 6 },
    { name: 'Quiz du jour', code: 'QUIZ99', players: 5, maxPlayers: 8 },
    { name: 'Défi Grammaire', code: 'GRAM7A', players: 2, maxPlayers: 4 },
  ];
}
