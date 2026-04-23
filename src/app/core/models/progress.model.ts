import { UserOut } from './user.model';

export interface UserProgressItemOut {
  user: UserOut;
  progress: {
    lessonsCompleted: string[];
    quizScores: Record<string, number[]>;
    exerciseScores: Record<string, number[]>;
  };
}
