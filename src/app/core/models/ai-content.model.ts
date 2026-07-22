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

export interface AIDelfMockItemDraft {
  itemOrder: number;
  title: string;
  prompt: string;
  points: number;
  content: Record<string, unknown>;
  answerKey: Record<string, unknown>;
  rubric: Record<string, unknown>;
  metadata: Record<string, unknown>;
}

export interface AIDelfMockSectionDraft {
  sectionOrder: number;
  sectionType: 'listening' | 'reading' | 'writing' | 'speaking';
  title: string;
  durationMinutes: number;
  points: number;
  instructions: string;
  audioUrl?: string | null;
  rubric: Record<string, unknown>;
  metadata: Record<string, unknown>;
  items: AIDelfMockItemDraft[];
}

export interface AIDelfMockExamDraft {
  track: 'Prime' | 'Junior';
  level: string;
  title: string;
  description: string | null;
  status: 'draft' | 'published' | 'archived';
  sourceNotes: string | null;
  sections: AIDelfMockSectionDraft[];
  assets: Array<{
    assetType: string;
    title: string;
    url: string;
    metadata: Record<string, unknown>;
  }>;
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

export interface AIDelfMockExamOut {
  provider: AIProviderInfo;
  exam: AIDelfMockExamDraft;
}
