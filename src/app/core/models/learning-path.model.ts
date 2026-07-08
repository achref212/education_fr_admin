export interface LearningPathOut {
  id: string;
  classLevel: string;
  title: string;
  description?: string | null;
  delfTargetLevel: string;
  isActive: boolean;
  createdAt: string;
}

export interface LearningPathStepOut {
  id: string;
  pathId: string;
  stepOrder: number;
  stepType: string;
  title: string;
  xpReward: number;
  quizCategory?: string | null;
  lessonId?: string | null;
  storyId?: string | null;
  requiredStepId?: string | null;
  createdAt: string;
}

export interface LearningPathCreateIn {
  classLevel: string;
  title: string;
  delfTargetLevel: string;
  description?: string | null;
}

export interface LearningPathUpdateIn {
  title?: string;
  description?: string | null;
  delfTargetLevel?: string;
  isActive?: boolean;
}

export interface LearningPathStepCreateIn {
  stepOrder: number;
  stepType: string;
  title: string;
  xpReward?: number;
  quizCategory?: string | null;
  lessonId?: string | null;
  storyId?: string | null;
  requiredStepId?: string | null;
}
