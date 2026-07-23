export interface LessonOut {
  id: string;
  title: string;
  content: string;
  category: string;
  level: string;
  sortOrder: number;
  createdAt: string;
  professorId?: string | null;
  schoolId?: string | null;
  visibility?: 'public' | 'school' | string;
}
