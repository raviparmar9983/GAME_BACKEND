import { messageKey, modelKey } from '@constants';
import { GameDTO } from '@dtos';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CustomeError } from '@utils';
import { Model } from 'mongoose';

@Injectable()
export class GameService {
  constructor(
    @InjectModel(modelKey.game) private readonly gameModel: Model<GameDTO>,
  ) {}

  async createGame(userId: string, gameData: GameDTO) {
    const { gridSize, playerCount } = gameData;
    const grid = this.createGrid(gridSize);
    const game = await this.gameModel.create({
      gridSize,
      grid,
      playerCount,
      players: [{ userId }],
      currTurn: userId,
    });
    if (!game) throw new CustomeError(messageKey.recordNotCreated);
    return {
      status: true,
      message: messageKey.recordCreatedSuccessfully('Room'),
      data: game,
    };
  }

  createGrid(gridSize) {
    return Array.from({ length: gridSize }, () =>
      Array.from({ length: gridSize }, () => null),
    );
  }

  async joinPlayerToGame({
    gameId,
    userId,
  }: {
    gameId: string;
    userId: string;
  }) {
    const game = await this.gameModel.findById(gameId);
    if (!game) throw new CustomeError(messageKey.recordNotFound('Game'));
    if (game.completed) throw new CustomeError(messageKey.gameCompleted);
    if (game.players.find((p) => p.userId.toString() === userId)) return true;
    if (game.players.length >= game.playerCount) {
      throw new CustomeError(messageKey.roomIsFull);
    }
    return await this.addPlayerToGame(gameId, userId);
  }

  async addPlayerToGame(gameId: string, userId: string) {
    const result = await this.gameModel.updateOne(
      { _id: gameId },
      {
        $push: {
          players: {
            userId,
            isConnected: true,
          },
        },
      },
    );
    if (result.modifiedCount === 0)
      throw new CustomeError('Failed to add player');
    return true;
  }

  async getGamePlayers(gameId: string) {
    const game = await this.gameModel
      .findById(gameId)
      .populate('players.userId', 'firstName lastName  email');
    return game?.players || [];
  }
}
