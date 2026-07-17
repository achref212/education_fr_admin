export interface ParcoursStepOut {
  id: string;
  stepOrder: number;
  stepType: string;
  title: string;
  xpReward: number;
  status: string;
  quizCategory?: string | null;
  lessonId?: string | null;
  storyId?: string | null;
  requiredStepId?: string | null;
  score?: number | null;
  attempts: number;
}

export interface ParcoursOut {
  pathId: string;
  assignedPathId?: string | null;
  title: string;
  description?: string | null;
  classLevel: string;
  delfTargetLevel: string;
  totalXp: number;
  currentStreak: number;
  preferredDifficulty: string;
  completionPercent: number;
  steps: ParcoursStepOut[];
}

export interface ParcoursSummaryOut {
  classLevel: string;
  delfTargetLevel: string;
  completionPercent: number;
  totalSteps: number;
  completedSteps: number;
  totalXp: number;
  currentStreak: number;
  preferredDifficulty: string;
  nextStepId?: string | null;
  nextStepTitle?: string | null;
}
