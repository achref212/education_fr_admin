export interface AIContentGenerateIn {
  classLevel: string;
  targetDelfLevel: string;
  category?: string | null;
  count: number;
  difficulty: 'easy' | 'medium' | 'hard';
  teacherInstructions?: string | null;
}

export interface AIProviderInfo {
  provider: string;
  model: string;
  usedBackup: boolean;
}

export interface AIQuizQuestionDraft {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string | null;
  category: string;
  level: string;
  saved?: boolean;
}

export interface AILessonDraft {
  title: string;
  content: string;
  category: string;
  level: string;
  sortOrder: number;
  saved?: boolean;
}

export interface AILearningPathDraft {
  title: string;
  description: string | null;
  classLevel: string;
  delfTargetLevel: string;
  minScore: number | null;
  maxScore: number | null;
  isDefault: boolean;
  saved?: boolean;
}

export interface AIDelfTestDraft {
  name: string;
  description: string | null;
  classLevel: string;
  targetDelfLevel: string;
  questionsByCategory: Record<string, AIQuizQuestionDraft[]>;
}

export interface AIQuizQuestionsOut {
  provider: AIProviderInfo;
  questions: AIQuizQuestionDraft[];
}

export interface AILessonOut {
  provider: AIProviderInfo;
  lesson: AILessonDraft;
}

export interface AILearningPathOut {
  provider: AIProviderInfo;
  path: AILearningPathDraft;
}

export interface AIDelfTestOut {
  provider: AIProviderInfo;
  test: AIDelfTestDraft;
}
