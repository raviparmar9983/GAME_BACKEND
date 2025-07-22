import { GameStatus } from '@constants';
import { Types } from 'mongoose';

export interface PlayerDTO {
  userId: Types.ObjectId;
  icon: string;
  isConnected?: boolean;
}

export interface GameDTO {
  _id?: Types.ObjectId;
  gridSize: number;
  playerCount: number;
  players: PlayerDTO[];
  grid: string[][];
  currTurn: Types.ObjectId;
  status?: GameStatus;
  completed?: boolean;
}
