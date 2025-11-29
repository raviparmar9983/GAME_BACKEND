import { GameStatus, messageKey, modelKey } from '@constants';
import { GameDTO } from '@dtos';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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

    let roomCode = '';
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      attempts++;
      roomCode = this.generateRoomCode(6);

      const exists = await this.gameModel.findOne({ roomCode });
      if (!exists) break;
    }

    if (!roomCode) {
      throw new CustomeError(
        'Failed to generate unique room code,please try again',
      );
    }

    const game = await this.gameModel.create({
      gridSize,
      grid,
      playerCount,
      roomCode,
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

  async joinPlayerFromCode(code: string, userId: string) {
    const game = await this.gameModel.findOne({ roomCode: code });
    if (!game) throw new CustomeError(messageKey.recordNotFound('Game'));
    await this.joinPlayerToGame({ gameId: game._id.toString(), userId });
    return {
      status: true,
      data: { gameId: game._id.toString() },
      message: messageKey.successMessage,
    };
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

  async setPlayerIcon({
    gameId,
    userId,
    icon,
  }: {
    gameId: string;
    userId: string;
    icon: string;
  }) {
    // fetch game
    const game = await this.gameModel.findById(gameId);
    if (!game) throw new CustomeError(messageKey.recordNotFound('Game'));
    if (game.completed) throw new CustomeError(messageKey.gameCompleted);

    // check player present
    const player = game.players.find(
      (p: any) => p.userId.toString() === userId.toString(),
    );
    if (!player) throw new CustomeError('Not Allowed to select ICON');

    // check icon availability (no other player using same icon)
    const takenBy = game.players.find((p: any) => p.icon === icon);
    if (takenBy && takenBy.userId.toString() !== userId.toString()) {
      throw new CustomeError('Icon already taken');
    }

    // set icon for this player
    const result = await this.gameModel.updateOne(
      { _id: gameId, 'players.userId': player.userId },
      { $set: { 'players.$.icon': icon } },
    );

    if (result.modifiedCount === 0) {
      throw new CustomeError('Failed to set icon');
    }

    // return updated players list
    const updated = await this.getGamePlayers(gameId);
    return updated;
  }

  async getGameById(gameId: string) {
    const game = await this.gameModel
      .findById(gameId)
      .populate('players.userId', 'firstName lastName') // only fetch needed fields
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

    // --- ensure the user is a participant ---
    const playerIndex = game.players.findIndex(
      (p: any) => String(p.userId) === String(userId),
    );
    if (playerIndex === -1) throw new BadRequestException('player_not_in_game');

    // --- ensure it's the player's turn (currTurn is an ObjectId) ---
    if (!game.currTurn || String(game.currTurn) !== String(userId)) {
      throw new BadRequestException('not_your_turn');
    }

    // --- validate bounds ---
    const size =
      game.gridSize ?? (Array.isArray(game.grid) ? game.grid.length : null);
    if (size === null) throw new BadRequestException('invalid_game_size');

    if (row < 0 || col < 0 || row >= size || col >= size) {
      throw new BadRequestException('invalid_cell');
    }

    // --- validate empty cell ---
    const currentVal = game.grid[row][col];
    if (currentVal !== null && currentVal !== '') {
      throw new BadRequestException('cell_not_empty');
    }

    // --- use player's icon from DB (do NOT trust frontend icon) ---
    const player = game.players[playerIndex];
    if (!player?.icon) throw new BadRequestException('no_icon_assigned');

    game.grid[row][col] = player.icon;

    // --- rotate turn: find next player's userId (round-robin) ---
    const totalPlayers = game.players.length;
    const nextIndex = (playerIndex + 1) % totalPlayers;
    const nextPlayerUserId = game.players[nextIndex].userId;
    game.currTurn = nextPlayerUserId;

    // --- optional: check completion ---
    const isFull = game.grid
      .flat()
      .every((cell: any) => cell !== null && cell !== '');
    if (isFull) {
      game.completed = true;
      game.status = GameStatus.COMPLETED;
    }

    await game.save();

    // return full game document (Mongoose doc -> plain object)
    // Ensure currTurn is serializable (ObjectId -> string when JSONified)
    return await this.getGameById(gameId);
  }

  private generateRoomCode(length = 6): string {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let code = '';

    for (let i = 0; i < length; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return code;
  }
}
