import { GameStatus, messageKey, modelKey } from '@constants';
import { GameDTO, GameResultDTO } from '@dtos';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CustomeError } from '@utils';
import { Model } from 'mongoose';
import { calculateScores } from 'src/utils/calculateResult';

@Injectable()
export class GameService {
  constructor(
    @InjectModel(modelKey.game) private readonly gameModel: Model<GameDTO>,
    @InjectModel(modelKey.gameResult)
    private readonly gameResultModel: Model<GameResultDTO>,
  ) {}

  async createGame(userId: string, gameData: GameDTO, name: string) {
    const { gridSize, playerCount } = gameData;
    const grid = this.createGrid(gridSize);

    let roomCode = '';
    let attempts = 0;

    while (attempts < 5) {
      attempts++;
      roomCode = this.generateRoomCode(6);
      const exists = await this.gameModel.findOne({ roomCode });
      if (!exists) break;
    }

    const game = await this.gameModel.create({
      gridSize,
      grid,
      playerCount,
      roomCode,
      players: [{ userId, name }],
      currTurn: userId,
      status: GameStatus.WAITING,
      completed: false,
    });

    return {
      status: true,
      message: messageKey.recordCreatedSuccessfully('Room'),
      data: game,
    };
  }

  createGrid(gridSize: number) {
    return Array.from({ length: gridSize }, () =>
      Array.from({ length: gridSize }, () => null),
    );
  }

  async joinPlayerFromCode(code: string, userId: string, name: string) {
    const game = await this.gameModel.findOne({ roomCode: code });
    if (!game) throw new CustomeError(messageKey.recordNotFound('Game'));
    await this.joinPlayerToGame({ gameId: game._id.toString(), userId, name });
    return {
      status: true,
      data: { gameId: game._id.toString() },
      message: messageKey.successMessage,
    };
  }

  async joinPlayerToGame({
    gameId,
    userId,
    name,
  }: {
    gameId: string;
    userId: string;
    name: string;
  }) {
    const game = await this.gameModel.findById(gameId);
    if (!game) throw new CustomeError(messageKey.recordNotFound('Game'));

    if (game.status !== GameStatus.WAITING) {
      if (game.completed) {
        throw new CustomeError('Game Completed');
      }
      throw new CustomeError('Game already started');
    }

    if (game.players.find((p) => String(p.userId) === String(userId)))
      return true;

    if (game.players.length >= game.playerCount) {
      throw new CustomeError(messageKey.roomIsFull);
    }

    await this.gameModel.updateOne(
      { _id: gameId },
      { $push: { players: { userId, isConnected: true, name } } },
    );

    return true;
  }

  async getGamePlayers(gameId: string) {
    const game = await this.gameModel
      .findById(gameId)
      .populate('players.userId', 'firstName lastName email');

    return game?.players || [];
  }

  async setPlayerIcon({
    gameId,
    userId,
    icon,
  }: {
    gameId: string;
    userId: string;
    icon: string;
  }) {
    const game = await this.gameModel.findById(gameId);
    if (!game) throw new CustomeError('Game not found');

    if (game.status !== GameStatus.WAITING) {
      throw new CustomeError('Game already started, icon locked');
    }

    const player = game.players.find(
      (p) => String(p.userId) === String(userId),
    );
    if (!player) throw new CustomeError('Not allowed');

    const taken = game.players.find((p) => p.icon === icon);
    if (taken && String(taken.userId) !== String(userId)) {
      throw new CustomeError('Icon already taken');
    }

    await this.gameModel.updateOne(
      { _id: gameId, 'players.userId': userId },
      { $set: { 'players.$.icon': icon } },
    );

    return this.getGamePlayers(gameId);
  }

  async startGame(gameId: string) {
    const game = await this.gameModel.findById(gameId);
    if (!game) throw new CustomeError('Game not found');

    if (game.status !== GameStatus.WAITING) {
      throw new CustomeError('Game already started');
    }

    const allSelected = game.players.every((p) => p.icon);
    if (!allSelected) {
      throw new CustomeError('All players must select icon');
    }

    game.status = GameStatus.ACTIVE;
    await game.save();

    return game;
  }

  async getGameById(gameId: string) {
    const game = await this.gameModel
      .findById(gameId)
      .populate('players.userId', 'firstName lastName')
      .lean();

    if (!game) throw new NotFoundException('Game not found');

    return {
      grid: game.grid,
      currTurn: game.currTurn,
      size: game.gridSize,
      playerCount: game.playerCount,
      status: game.status,
      completed: game.completed,
      roomCode: game.roomCode,
      players: game.players.map((p) => ({
        _id: p.userId?._id,
        firstName: (p.userId as any)?.firstName,
        lastName: (p.userId as any)?.lastName,
        icon: p.icon,
      })),
    };
  }

  async playMove(gameId: string, userId: string, row: number, col: number) {
    const game = await this.gameModel.findById(gameId);
    if (!game) throw new BadRequestException('game_not_found');

    if (game.status !== GameStatus.ACTIVE) {
      throw new BadRequestException('Game not Start');
    }

    const playerIndex = game.players.findIndex(
      (p) => String(p.userId) === String(userId),
    );
    if (playerIndex === -1)
      throw new BadRequestException('You are not Part of this game');

    if (String(game.currTurn) !== String(userId)) {
      throw new BadRequestException('Wrong turn');
    }

    if (game.grid[row][col] !== null)
      throw new BadRequestException('Cell already filled');

    const player = game.players[playerIndex];
    game.grid[row][col] = player.icon;

    const nextIndex = (playerIndex + 1) % game.players.length;
    game.currTurn = game.players[nextIndex].userId;

    const isFull = game.grid.flat().every((c) => c !== null);
    if (isFull) {
      game.completed = true;
      game.status = GameStatus.COMPLETED;
    }

    await game.save();
    if (game.completed) {
      try {
        this.getOrCalculateResult(gameId);
      } catch (err) {
        console.error(err);
      }
    }
    return this.getGameById(gameId);
  }

  private generateRoomCode(length = 6): string {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from({ length })
      .map(() => chars[Math.floor(Math.random() * chars.length)])
      .join('');
  }

  async getOrCalculateResult(gameId: string) {
    // 1️⃣ Return cached result if exists
    const existingResult = await this.gameResultModel.findOne({ gameId });
    if (existingResult) {
      return {
        source: 'DB',
        result: existingResult,
      };
    }

    // 2️⃣ Validate game
    const game = await this.gameModel.findById(gameId);
    if (!game) throw new NotFoundException('Game not found');

    if (!game.completed) {
      throw new BadRequestException('Game is not completed yet');
    }

    // 3️⃣ Prepare lookup map (performance)
    const playerMap = new Map(
      game.players.map((p) => [p.userId.toString(), p]),
    );

    // 4️⃣ Calculate scores
    const scores = calculateScores(game.grid, game.players);
    const maxScore = Math.max(...scores.map((s) => s.point));

    // 5️⃣ Final player snapshot (IMPORTANT)
    const finalPlayers = scores.map((s) => {
      const gamePlayer = playerMap.get(s.userId);

      return {
        userId: s.userId,
        name: gamePlayer?.name ?? 'Player', // 👈 SNAPSHOT NAME
        icon: s.icon,
        point: s.point,
        block: s.block,
        isWinner: maxScore > 0 && s.point === maxScore,
        isConnectedAtEnd: gamePlayer?.isConnected ?? false,
      };
    });

    // 6️⃣ Decide game status
    const gameStatus = maxScore === 0 ? 'DRAW' : 'WIN';

    // 7️⃣ Save result
    const savedResult = await this.gameResultModel.create({
      gameId: game._id,
      roomCode: game.roomCode,
      gridSize: game.gridSize,
      status: gameStatus,
      startedAt: game.createdAt,
      endedAt: new Date(),
      durationMs: Date.now() - game.createdAt.getTime(),
      players: finalPlayers,
      finalGrid: game.grid,
    });

    // 8️⃣ Return consistent response
    return {
      source: 'CALCULATED',
      result: savedResult,
    };
  }
}
