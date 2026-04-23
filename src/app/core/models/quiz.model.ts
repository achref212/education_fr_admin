export interface QuizQuestionOut {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string | null;
  category: string;
  level: string;
}
