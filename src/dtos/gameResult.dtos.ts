export interface PlayerResultDTO {
  userId: string;
  icon: string | null;
  point: number;
  block: number;
  isWinner: boolean;
  isConnectedAtEnd: boolean;
}

export interface GameResultDTO {
  gameId: string;
  roomCode: string;
  gridSize: number;

  status: 'WIN' | 'DRAW' | 'CANCELLED';

  durationMs: number;

  players: PlayerResultDTO[];

  finalGrid: string[][];
}
