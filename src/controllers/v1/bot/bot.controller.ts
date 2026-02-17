import {
  Body,
  Controller,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { BotService } from './bot.service';
import { AuthGuard } from 'src/comman/guards';
import { GameDTO } from '@dtos';
import { Request, Response } from 'express';
import { handleError } from '@utils';

@Controller('v1/bot')
@UseGuards(AuthGuard)
export class BotController {
  constructor(private readonly botService: BotService) {}

  @Post('/')
  async createBotGame(
    @Req() req: Request,
    @Body() gameData: GameDTO,
    @Res() res: Response,
  ) {
    try {
      const { _id, userName } = req?.body?.jwtTokendata;
      const game = await this.botService.createBotGame(_id, gameData, userName);
      res.status(HttpStatus.CREATED).json(game);
    } catch (err) {
      handleError(res, err);
    }
  }
}
