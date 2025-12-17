import { Types, Schema } from 'mongoose';

const GameResultSchema = new Schema(
  {
    gameId: {
      type: Types.ObjectId,
      ref: 'Game',
      unique: true, // ✅ HARD guarantee: only ONE result per game
      index: true,
    },

    roomCode: { type: String, index: true },

    gridSize: Number,

    status: {
      type: String,
      enum: ['WIN', 'DRAW', 'CANCELLED'],
      index: true,
    },

    durationMs: Number,

    players: [
      {
        userId: { type: Types.ObjectId, ref: 'User', index: true },
        icon: String,
        point: Number,
        name: String,
        block: Number,
        isWinner: Boolean,
        isConnectedAtEnd: Boolean,
      },
    ],

    finalGrid: [[String]],
  },
  { timestamps: true },
);

export { GameResultSchema };
