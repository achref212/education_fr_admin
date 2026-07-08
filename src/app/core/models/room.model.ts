export interface MultiplayerRoomOut {
  id: string;
  roomCode: string;
  data: Record<string, unknown>;
  label: string | null;
  createdAt: string;
  updatedAt: string;
  professorId?: string;
  schoolId?: string;
  classLevel?: string | null;
  activeSessionId?: string | null;
  participantCount?: number;
}

export interface StudentGroupOut {
  classLevel: string;
  students: RoomStudentOut[];
}

export interface RoomStudentOut {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  classLevel?: string | null;
  level?: string;
  isActive: boolean;
}

export interface RoomCreateIn {
  label?: string | null;
  classLevel: string;
  participantIds: string[];
}
