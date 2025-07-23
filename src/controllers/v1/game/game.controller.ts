import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { GameService } from './game.service';
import { AuthGuard } from 'src/comman/guards';
import { GameDTO } from '@dtos';
import { handleError } from '@utils';
import { Request, Response } from 'express';
import { YupValidationPipe } from 'src/comman/pipe';
import { createRoomValidators } from '@validators';

@Controller('v1/game')
@UseGuards(AuthGuard)
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Post('')
  @UsePipes(new YupValidationPipe(createRoomValidators))
  @HttpCode(HttpStatus.CREATED)
  async createGame(
    @Req() req: Request,
    @Body() gameData: GameDTO,
    @Res() res: Response,
  ) {
    try {
      const { _id } = req?.body?.jwtTokendata;
      const game = await this.gameService.createGame(_id, gameData);
      return game;
    } catch (err) {
      handleError(res, err);
    }
  }
}
