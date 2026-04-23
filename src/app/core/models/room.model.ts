export interface MultiplayerRoomOut {
  id: string;
  roomCode: string;
  data: Record<string, unknown>;
  label: string | null;
  createdAt: string;
  updatedAt: string;
}
