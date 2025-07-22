import { Module } from '@nestjs/common';
import { GameService } from './game.service';
import { GameController } from './game.controller';
import { GameGateway } from '@gateways';
import { MongooseModule } from '@nestjs/mongoose';
import { modelKey } from '@constants';
import { GameSchema } from '@models';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: modelKey.game, schema: GameSchema }]),
  ],
  controllers: [GameController],
  providers: [GameService, GameGateway],
})
export class GameModule {}
