import { GameStatus } from '@constants';
import { Types } from 'mongoose';
import { AuditFieldDTO } from './comman.dtos';

export interface PlayerDTO {
  userId: Types.ObjectId;
  icon: string;
  isConnected?: boolean;
  name: string;
}

export interface GameDTO extends AuditFieldDTO {
  _id?: Types.ObjectId;
  gridSize: number;
  playerCount: number;
  players: PlayerDTO[];
  grid: string[][];
  currTurn: Types.ObjectId;
  status?: GameStatus;
  completed?: boolean;
  roomCode?: boolean;
}
