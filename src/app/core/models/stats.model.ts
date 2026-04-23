export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalLessons: number;
  totalQuizQuestions: number;
  totalStories: number;
  unreadMessages: number;
  multiplayerRooms: number;
  usersByLevel: Record<string, number>;
  lessonsByCategory: Record<string, number>;
}
