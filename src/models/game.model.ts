import { GameStatus } from '@constants';
import { Schema, Types } from 'mongoose';

const playerSchema = new Schema(
  {
    userId: {
      type: Types.ObjectId,
      ref: 'User',
      required: true,
    },
    icon: {
      type: String,
      required: false,
    },
    isConnected: {
      type: Boolean,
      default: true,
    },
    name: {
      type: String,
      required: true,
    },
  },
  { _id: false },
);

const GameSchema = new Schema(
  {
    gridSize: { type: Number, required: true },
    playerCount: { type: Number, required: true },
    players: [playerSchema],
    grid: {
      type: [[String]],
      required: true,
    },
    roomCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    currTurn: {
      type: Types.ObjectId,
      ref: 'User',
      required: false,
    },
    status: {
      type: String,
      enum: GameStatus,
      default: GameStatus.WAITING,
    },
    completed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

export { GameSchema };

// i am giving you my game model and game controller , game socket gateway ,game.service.ts
// analyis it closely adn in depth then i will let you know  my requiret
