export type AppPreviewScreenKey =
  | 'delfIntro'
  | 'delfQuestion'
  | 'delfResult'
  | 'home'
  | 'learnCategory'
  | 'learnLesson'
  | 'multiplayer'
  | 'profile';

export type PreviewTheme = 'light' | 'dark';

export interface AppPreviewStep {
  id: string;
  order: number;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  screenKey: AppPreviewScreenKey;
  bottomNavIndex: number | null;
  highlights: string[];
  homeVariant?: 'initial' | 'return';
}
