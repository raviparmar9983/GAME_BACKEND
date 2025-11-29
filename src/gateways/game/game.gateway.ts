import { messageKey } from '@constants';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { CustomeError, JwtService } from '@utils';

import { Server, Socket } from 'socket.io';
import { AuthWsMiddleware } from 'src/comman/guards';
import { GameService } from 'src/controllers/v1/game/game.service';
import { PresenceService } from 'src/utils/presence.service';

@WebSocketGateway({
  cors: { origin: '*' },
})
export class GameGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly presenceService: PresenceService,
    private readonly gameService: GameService,
  ) {}

  afterInit(server: Server) {
    this.server = server;
    console.info('Socket server initialized');
    server.use(AuthWsMiddleware(this.jwtService));
  }

  handleConnection(client: Socket) {
    const user = client?.data?.user;
    if (user) {
      this.presenceService.addConnection(user._id, client.id);
    }
  }

  handleDisconnect(client: Socket) {
    const user = client?.data?.user;
    if (user) {
      this.presenceService.removeConnection(user._id, client.id);
    }
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(client: Socket, payload: { gameId: string }) {
    try {
      const userId = client?.data?.user?._id;
      const isPlayerAdd = await this.gameService.joinPlayerToGame({
        ...payload,
        userId,
      });
      if (!isPlayerAdd) throw new CustomeError(messageKey.roomJoinFail);
      client.join(payload.gameId);
      this.server.to(payload.gameId).emit('playerJoined', {
        userId,
        players: await this.gameService.getGamePlayers(payload.gameId),
      });
    } catch (err) {
      client.emit('error', { message: err?.message || 'Failed to join room' });
    }
  }

  @SubscribeMessage('selectIcon')
  async handleSelectIcon(
    client: Socket,
    payload: { gameId: string; icon: string },
  ) {
    try {
      const userId = client?.data?.user?._id;
      if (!userId) throw new CustomeError(messageKey.unauthorizeResourse);

      const updatedPlayers = await this.gameService.setPlayerIcon({
        gameId: payload.gameId,
        userId,
        icon: payload.icon,
      });

      // broadcast updated players to the room
      this.server.to(payload.gameId).emit('playerUpdated', {
        players: updatedPlayers,
      });

      // return ack to the caller (socket.emit with callback will receive this)
      return { status: true, players: updatedPlayers };
    } catch (err) {
      // emit error to caller only
      client.emit('error', {
        message: err?.message || 'Failed to select icon',
      });
      // also return failure ack
      return {
        status: false,
        message: err?.message || 'Failed to select icon',
      };
    }
  }

  @SubscribeMessage('startGame')
  async handleStartGame(@MessageBody() data: { gameId: string }) {
    const { gameId } = data;

    // const game = await this.gameService.startGame(gameId);
    // if (!game) return { status: false, message: 'Game not found or cannot start' };

    this.server.to(gameId).emit('gameStarted', { gameId });
    return { status: true };
  }

  /** -------------------------
   * Player makes a move
   * -------------------------
   * */
  @SubscribeMessage('PLAY_MOVE')
  async handlePlayMove(
    @MessageBody()
    body: { gameId: string; userId: string; row: number; col: number },
    @ConnectedSocket() client: Socket,
  ) {
    const { _id } = client.data.user;
    const { gameId, row, col } = body;

    try {
      const updatedGame = await this.gameService.playMove(
        gameId,
        _id,
        row,
        col,
      );

      // broadcast updated full game to all players in the room
      this.server.to(gameId).emit('GAME_UPDATED', updatedGame);
      // also send to the caller (redundant but keeps parity)
      client.emit('GAME_UPDATED', updatedGame);

      return { success: true };
    } catch (err) {
      // if err is BadRequestException from Nest it will include message
      const message = err?.message ?? 'move_failed';
      return { error: message };
    }
  }
}
