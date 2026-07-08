export interface GameOut {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  minPlayers: number;
  maxPlayers: number;
  defaultQuestionCount: number;
}

export interface GameCreateIn {
  slug: string;
  name: string;
  minPlayers?: number;
  maxPlayers?: number;
  defaultQuestionCount?: number;
  description?: string | null;
}
