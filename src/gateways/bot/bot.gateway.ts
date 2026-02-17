import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { GameService } from 'src/controllers/v1/game/game.service';
import { BotService } from 'src/controllers/v1/bot/bot.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class BotGateway {
  constructor(
    private readonly gameService: GameService,
    private readonly botService: BotService,
  ) {}

  @SubscribeMessage('PLAY_BOT_MOVE')
  async playBotMove(
    @MessageBody() body: { gameId: string; row: number; col: number },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      // 1. Human Move
      const updatedGame = await this.gameService.playMove(
        body.gameId,
        client.data.user._id,
        body.row,
        body.col,
      );
      client.emit('GAME_UPDATED', updatedGame); // Send to caller
      client.to(body.gameId).emit('GAME_UPDATED', updatedGame); // Send to room

      if (updatedGame.completed) {
        client.emit('GAME_COMPLETE');
        client.to(body.gameId).emit('GAME_COMPLETE');
        return { success: true };
      }

      // 2. Bot Move (Auto-triggered)
      const botGame = await this.botService.triggerBotMove(body.gameId);

      if (botGame) {
        client.emit('GAME_UPDATED', botGame);
        client.to(body.gameId).emit('GAME_UPDATED', botGame);
        if (botGame.completed) {
          client.emit('GAME_COMPLETE');
          client.to(body.gameId).emit('GAME_COMPLETE');
        }
      }

      return { success: true };
    } catch (err) {
      client.emit('ERROR', { message: err.message });
      return { success: false };
    }
  }
}
