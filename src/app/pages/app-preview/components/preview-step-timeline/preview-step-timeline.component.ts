import { Component, Input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { AppPreviewStep } from '../../models/app-preview-step.model';

@Component({
  selector: 'app-preview-step-timeline',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './preview-step-timeline.component.html',
  styleUrl: './preview-step-timeline.component.scss',
})
export class PreviewStepTimelineComponent {
  @Input({ required: true }) steps: AppPreviewStep[] = [];
  @Input({ required: true }) currentIndex = 0;

  stepSelected = output<number>();

  selectStep(index: number): void {
    this.stepSelected.emit(index);
  }
}
