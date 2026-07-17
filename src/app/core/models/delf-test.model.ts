export interface DelfTestSessionAdminOut {
  sessionId: string;
  userId: string;
  classLevel: string;
  targetDelfLevel: string;
  achievedDelfLevel?: string | null;
  overallScore?: number | null;
  categoryScores: Record<string, number>;
  status: string;
  startedAt?: string | null;
  finishedAt?: string | null;
  studentFirstName?: string | null;
  studentLastName?: string | null;
  studentEmail?: string | null;
}

export interface DelfTestHistoryOut {
  sessionId: string;
  classLevel: string;
  targetDelfLevel: string;
  achievedDelfLevel?: string | null;
  overallScore?: number | null;
  categoryScores: Record<string, number>;
  comparisonToTarget: string;
  finishedAt?: string | null;
}

export interface DelfLevelThreshold {
  level: string;
  minOverall: number;
  minCategory: number;
}

export interface DelfTestConfigOut {
  questionsPerCategory: number;
  levelThresholds: DelfLevelThreshold[];
  updatedAt: string;
}

export interface DelfTestResultsOut {
  sessionId: string;
  classLevel: string;
  targetDelfLevel: string;
  achievedDelfLevel?: string | null;
  overallScore?: number | null;
  categoryScores: Record<string, number>;
  comparisonToTarget: string;
  status: string;
  sections: DelfTestSectionResultOut[];
  finishedAt?: string | null;
}

export interface DelfTestSectionResultOut {
  category: string;
  score: number;
  questions: DelfTestQuestionResultOut[];
}

export interface DelfTestQuestionResultOut {
  questionId: string;
  question: string;
  options: string[];
  category: string;
  selectedIndex?: number | null;
  isCorrect: boolean;
  correctIndex?: number | null;
  explanation?: string | null;
}

export interface DelfTestQuestionOut {
  id: string;
  question: string;
  options: string[];
  category: string;
  level: string;
}

export interface DelfTestTemplateSectionOut {
  category: string;
  questionIds: string[];
  questionCount: number;
  questions?: DelfTestQuestionOut[] | null;
}

export interface DelfTestTemplateOut {
  id: string;
  name: string;
  description?: string | null;
  classLevel: string;
  targetDelfLevel: string;
  isActive: boolean;
  questionIdsByCategory: Record<string, string[]>;
  sections: DelfTestTemplateSectionOut[];
  totalQuestions: number;
  createdAt: string;
  updatedAt: string;
}
