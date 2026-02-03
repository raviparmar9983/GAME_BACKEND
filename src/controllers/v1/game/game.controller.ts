import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
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
  async createGame(
    @Req() req: Request,
    @Body() gameData: GameDTO,
    @Res() res: Response,
  ) {
    try {
      const { _id, userName } = req?.body?.jwtTokendata;
      const game = await this.gameService.createGame(_id, gameData, userName);
      res.status(HttpStatus.CREATED).json(game);
    } catch (err) {
      handleError(res, err);
    }
  }

  @Post('/join/:code')
  async joinPlayerToGame(
    @Param('code') code: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const { _id, userName } = req?.body?.jwtTokendata;
      const game = await this.gameService.joinPlayerFromCode(
        code,
        _id,
        userName,
      );
      res.status(HttpStatus.CREATED).json(game);
    } catch (err) {
      handleError(res, err);
    }
  }

  @Get(':gameId')
  @UsePipes(new YupValidationPipe(createRoomValidators))
  async getGame(@Param('gameId') gameId: string, @Res() res: Response) {
    try {
      const game = await this.gameService.getGameById(gameId);
      res.status(HttpStatus.OK).json(game);
    } catch (err) {
      handleError(res, err);
    }
  }

  @Get(':gameId/result')
  async getGameResult(@Param('gameId') gameId: string, @Res() res: Response) {
    try {
      const result = await this.gameService.getOrCalculateResult(gameId);
      res.status(HttpStatus.OK).json(result);
    } catch (error) {
      handleError(res, error);
    }
  }
}
