import {
  Component,
  computed,
  HostListener,
  OnDestroy,
  signal,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { animate, style, transition, trigger } from '@angular/animations';

import { APP_PREVIEW_STEPS } from './data/app-preview-steps.data';
import { AppPreviewStep, PreviewTheme } from './models/app-preview-step.model';
import { PreviewStepTimelineComponent } from './components/preview-step-timeline/preview-step-timeline.component';
import { PhoneFrameComponent } from './components/phone-frame/phone-frame.component';
import { DelfTestIntroScreenComponent } from './components/screens/delf-test-intro-screen/delf-test-intro-screen.component';
import { DelfTestQuestionScreenComponent } from './components/screens/delf-test-question-screen/delf-test-question-screen.component';
import { DelfTestResultScreenComponent } from './components/screens/delf-test-result-screen/delf-test-result-screen.component';
import { HomeScreenComponent } from './components/screens/home-screen/home-screen.component';
import { LearnCategoryScreenComponent } from './components/screens/learn-category-screen/learn-category-screen.component';
import { LearnLessonScreenComponent } from './components/screens/learn-lesson-screen/learn-lesson-screen.component';
import { MultiplayerScreenComponent } from './components/screens/multiplayer-screen/multiplayer-screen.component';
import { ProfileScreenComponent } from './components/screens/profile-screen/profile-screen.component';

const AUTO_PLAY_INTERVAL_MS = 4000;

@Component({
  selector: 'app-app-preview',
  standalone: true,
  imports: [
    MatIconModule,
    PreviewStepTimelineComponent,
    PhoneFrameComponent,
    DelfTestIntroScreenComponent,
    DelfTestQuestionScreenComponent,
    DelfTestResultScreenComponent,
    HomeScreenComponent,
    LearnCategoryScreenComponent,
    LearnLessonScreenComponent,
    MultiplayerScreenComponent,
    ProfileScreenComponent,
  ],
  templateUrl: './app-preview.component.html',
  styleUrl: './app-preview.component.scss',
  animations: [
    trigger('screenFade', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(12px)' }),
        animate('280ms ease-out', style({ opacity: 1, transform: 'none' })),
      ]),
      transition(':leave', [
        animate('180ms ease-in', style({ opacity: 0, transform: 'translateX(-12px)' })),
      ]),
    ]),
  ],
})
export class AppPreviewComponent implements OnDestroy {
  readonly steps: AppPreviewStep[] = APP_PREVIEW_STEPS;
  readonly currentStepIndex = signal(0);
  readonly previewTheme = signal<PreviewTheme>('light');
  readonly isAutoPlaying = signal(false);

  readonly currentStep = computed(() => this.steps[this.currentStepIndex()]);
  readonly canGoPrev = computed(() => this.currentStepIndex() > 0);
  readonly canGoNext = computed(() => this.currentStepIndex() < this.steps.length - 1);
  readonly showBottomNav = computed(() => this.currentStep().bottomNavIndex !== null);

  private autoPlayTimer: ReturnType<typeof setInterval> | null = null;

  @HostListener('window:keydown', ['$event'])
  handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.goPrev();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.goNext();
    }
  }

  ngOnDestroy(): void {
    this.stopAutoPlay();
  }

  selectStep(index: number): void {
    if (index >= 0 && index < this.steps.length) {
      this.currentStepIndex.set(index);
    }
  }

  goPrev(): void {
    if (this.canGoPrev()) {
      this.currentStepIndex.update(i => i - 1);
    }
  }

  goNext(): void {
    if (this.canGoNext()) {
      this.currentStepIndex.update(i => i + 1);
    } else if (this.isAutoPlaying()) {
      this.stopAutoPlay();
    }
  }

  toggleTheme(): void {
    this.previewTheme.update(t => (t === 'light' ? 'dark' : 'light'));
  }

  toggleAutoPlay(): void {
    if (this.isAutoPlaying()) {
      this.stopAutoPlay();
      return;
    }
    this.isAutoPlaying.set(true);
    this.autoPlayTimer = setInterval(() => {
      if (this.canGoNext()) {
        this.currentStepIndex.update(i => i + 1);
      } else {
        this.stopAutoPlay();
      }
    }, AUTO_PLAY_INTERVAL_MS);
  }

  private stopAutoPlay(): void {
    this.isAutoPlaying.set(false);
    if (this.autoPlayTimer) {
      clearInterval(this.autoPlayTimer);
      this.autoPlayTimer = null;
    }
  }
}
