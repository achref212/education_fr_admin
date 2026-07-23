export interface StoryOut {
  id: string;
  title: string;
  content: string;
  level: string;
  audioUrl: string | null;
  createdAt: string;
  professorId?: string | null;
  schoolId?: string | null;
  visibility?: 'public' | 'school' | string;
}
