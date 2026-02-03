import { GameStatus, messageKey, modelKey } from '@constants';
import { GameDTO, GameResultDTO, UserDTO } from '@dtos';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { CustomeError } from '@utils';
import mongoose, { Model } from 'mongoose';
import { calculateScores } from 'src/utils/calculateResult';

@Injectable()
export class GameService {
  constructor(
    @InjectModel(modelKey.game) private readonly gameModel: Model<GameDTO>,
    @InjectModel(modelKey.users) private readonly userModel: Model<UserDTO>,
    @InjectModel(modelKey.gameResult)
    private readonly gameResultModel: Model<GameResultDTO>,
    @InjectConnection() private readonly connection: any,
  ) {}
  async createGame(userId: string, gameData: GameDTO, name: string) {
    const session = await this.connection.startSession();

    try {
      session.startTransaction();

      const { gridSize, playerCount, entryFee } = gameData;
      const grid = this.createGrid(gridSize);

      // 🔁 generate unique room code
      let roomCode = '';
      let attempts = 0;

      while (attempts < 5) {
        attempts++;
        roomCode = this.generateRoomCode(6);
        const exists = await this.gameModel
          .findOne({ roomCode })
          .session(session);

        if (!exists) break;
      }

      if (!roomCode) {
        throw new CustomeError('Unable to generate room code');
      }

      // 🔍 fetch user
      const user = await this.userModel.findById(userId).session(session);

      if (!user) {
        throw new CustomeError(messageKey.recordNotFound('User'));
      }

      // 💰 coin validation
      if (user.coins < entryFee) {
        throw new CustomeError('Insufficient coins');
      }

      // 🔥 reserve coins (creator pays entry fee)
      user.coins -= entryFee;

      // 🎮 create game with initial pot
      const game = await this.gameModel.create(
        [
          {
            gridSize,
            grid,
            playerCount,
            roomCode,
            entryFee,
            potCoins: entryFee, // 👈 initial pot
            players: [
              {
                userId,
                name,
                isConnected: true,
                contributedCoins: entryFee,
                paidEntry: true,
              },
            ],
            currTurn: userId,
            status: GameStatus.WAITING,
            completed: false,
          },
        ],
        { session },
      );

      await user.save({ session });

      await session.commitTransaction();

      return {
        status: true,
        message: messageKey.recordCreatedSuccessfully('Room'),
        data: game[0],
      };
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
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
    const session = await this.connection.startSession();

    try {
      session.startTransaction();

      const game = await this.gameModel.findById(gameId).session(session);

      if (!game) {
        throw new CustomeError(messageKey.recordNotFound('Game'));
      }

      if (game.status !== GameStatus.WAITING) {
        if (game.completed) {
          throw new CustomeError('Game Completed');
        }
        throw new CustomeError('Game already started');
      }

      // ✅ prevent duplicate join
      if (game.players.some((p) => String(p.userId) === String(userId))) {
        await session.commitTransaction();
        return true;
      }

      if (game.players.length >= game.playerCount) {
        throw new CustomeError(messageKey.roomIsFull);
      }

      const user = await this.userModel.findById(userId).session(session);

      if (!user) {
        throw new CustomeError(messageKey.recordNotFound('User'));
      }

      if (user.coins < game.entryFee) {
        throw new CustomeError('Insufficient coins');
      }

      user.coins -= game.entryFee;
      game.potCoins += game.entryFee;

      game.players.push({
        userId: new mongoose.Types.ObjectId(userId),
        name,
        isConnected: true,
        icon: null,
      });

      await user.save({ session });
      await game.save({ session });

      await session.commitTransaction();
      return true;
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  }

  async getGamePlayers(gameId: string) {
    const game = await this.gameModel
      .findById(gameId)
      .populate('players.userId', 'userName email');

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
      .populate('players.userId', 'userName')
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
        userName: (p.userId as any)?.userName,
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
    const winners = finalPlayers.filter((p) => p.isWinner).map((w) => w.userId);
    await this.settleGameCoins(gameId, winners);
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

  async settleGameCoins(gameId: string, winnerIds: string[]) {
    if (!winnerIds?.length) return true;
    const session = await this.connection.startSession();

    try {
      session.startTransaction();

      const game = await this.gameModel
        .findOne({ _id: gameId })
        .session(session);

      if (!game) throw new NotFoundException('Game not found');

      // 🟡 DRAW → refund everyone
      if (winnerIds.length === 0) {
        for (const player of game.players) {
          await this.userModel.updateOne(
            { _id: player.userId },
            { $inc: { coins: game.entryFee } },
            { session },
          );
        }
        game.potCoins = 0;
        await game.save({ session });
        await session.commitTransaction();
        return;
      }

      // 🟢 WIN → distribute pot
      const rewardPerWinner = Math.floor(game.potCoins / winnerIds.length);

      for (const userId of winnerIds) {
        await this.userModel.updateOne(
          { _id: userId },
          { $inc: { coins: rewardPerWinner } },
          { session },
        );
      }
      game.potCoins = 0;
      await game.save({ session });
      await session.commitTransaction();
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  }
}
