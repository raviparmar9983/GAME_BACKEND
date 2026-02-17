import { Module, Global, forwardRef } from '@nestjs/common';
import { BotGateway } from 'src/gateways/bot/bot.gateway';
import { GameModule } from '../game/game.module';
import { BotService } from './bot.service';
import { BotController } from './bot.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { modelKey } from '@constants';
import { UserSchema, GameSchema, GameResultSchema } from '@models';

@Global()
@Module({
  imports: [
    forwardRef(() => GameModule),
    MongooseModule.forFeature([
      { name: modelKey.game, schema: GameSchema },
      { name: modelKey.gameResult, schema: GameResultSchema },
      { name: modelKey.users, schema: UserSchema },
    ]),
  ],
  controllers: [BotController],
  providers: [BotService, BotGateway],
  exports: [BotService],
})
export class BotModule {}
