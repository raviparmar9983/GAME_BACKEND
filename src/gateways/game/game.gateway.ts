import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { JwtService } from '@utils';

import { Server, Socket } from 'socket.io';
import { AuthWsMiddleware } from 'src/comman/guards';
import { GameService } from 'src/controllers/v1/game/game.service';
import { PresenceService } from 'src/utils/presence.service';

@WebSocketGateway({ cors: { origin: '*' } })
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
    server.use(AuthWsMiddleware(this.jwtService));
  }

  handleConnection(client: Socket) {
    const user = client?.data?.user;
    if (user) this.presenceService.addConnection(user._id, client.id);
  }

  handleDisconnect(client: Socket) {
    const user = client?.data?.user;
    if (user) this.presenceService.removeConnection(user._id, client.id);
  }

  @SubscribeMessage('joinRoom')
  async joinRoom(client: Socket, payload: { gameId: string }) {
    try {
      const userId = client.data.user._id;
      const name = `${client.data.user.firstName} ${client.data.user.lastName} `;
      await this.gameService.joinPlayerToGame({
        gameId: payload.gameId,
        userId,
        name,
      });

      client.join(payload.gameId);

      this.server.to(payload.gameId).emit('playerJoined', {
        players: await this.gameService.getGamePlayers(payload.gameId),
      });
    } catch (err) {
      client.emit('ERROR', { message: err.message });
    }
  }

  @SubscribeMessage('joingameplay')
  async joinGamePlay(client: Socket, payload: { gameId: string }) {
    try {
      client.join(payload.gameId);
    } catch (err) {
      client.emit('ERROR', { message: err.message });
    }
  }

  @SubscribeMessage('selectIcon')
  async selectIcon(client: Socket, payload: { gameId: string; icon: string }) {
    try {
      const userId = client.data.user._id;

      const players = await this.gameService.setPlayerIcon({
        gameId: payload.gameId,
        userId,
        icon: payload.icon,
      });

      this.server.to(payload.gameId).emit('playerUpdated', { players });
      return { status: true };
    } catch (err) {
      client.emit('ERROR', { message: err.message });
      return { status: false };
    }
  }

  @SubscribeMessage('startGame')
  async startGame(client: Socket, payload: { gameId: string }) {
    try {
      const game = await this.gameService.startGame(payload.gameId);

      this.server.to(payload.gameId).emit('gameStarted', game);
      return { status: true };
    } catch (err) {
      client.emit('ERROR', { message: err.message });
      return { status: false };
    }
  }

  @SubscribeMessage('PLAY_MOVE')
  async playMove(
    @MessageBody() body: { gameId: string; row: number; col: number },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const updatedGame = await this.gameService.playMove(
        body.gameId,
        client.data.user._id,
        body.row,
        body.col,
      );
      this.server.to(body.gameId).emit('GAME_UPDATED', updatedGame);
      if (updatedGame.completed) {
        this.server.to(body.gameId).emit('GAME_COMPLETE');
      }
      return { success: true };
    } catch (err) {
      client.emit('ERROR', { message: err.message });
      return { success: false };
    }
  }
}
