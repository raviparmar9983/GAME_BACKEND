import { messageKey } from '@constants';
import {
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
}
