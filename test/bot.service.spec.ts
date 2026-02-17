import { Test, TestingModule } from '@nestjs/testing';
import { BotService } from '../src/controllers/v1/bot/bot.service';
import { getModelToken } from '@nestjs/mongoose';
import { modelKey } from '../src/constants';
import { GameService } from '../src/controllers/v1/game/game.service';

describe('BotService', () => {
  let service: BotService;

  const mockUserModel = {
    findOne: jest.fn(),
    create: jest.fn(),
  };

  const mockGameModel = {
    findById: jest.fn(),
  };

  const mockGameService = {
    playMove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BotService,
        {
          provide: getModelToken(modelKey.users),
          useValue: mockUserModel,
        },
        {
          provide: getModelToken(modelKey.game),
          useValue: mockGameModel,
        },
        {
          provide: GameService,
          useValue: mockGameService,
        },
      ],
    }).compile();

    service = module.get<BotService>(BotService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getBestMove', () => {
    it('should block opponent win', async () => {
      // O is opponent, X is bot
      const grid = [
        ['O', 'O', null],
        [null, 'X', null],
        [null, null, null],
      ];
      const move = await service.getBestMove(grid, 'X', 'O');
      expect(move).toEqual({ row: 0, col: 2 });
    });

    it('should take winning move', async () => {
      const grid = [
        ['X', 'X', null],
        ['O', null, 'O'],
        [null, null, null],
      ];
      const move = await service.getBestMove(grid, 'X', 'O');
      expect(move).toEqual({ row: 0, col: 2 });
    });

    it('should pick center or random if empty', async () => {
      const grid = [
        [null, null, null],
        [null, null, null],
        [null, null, null],
      ];
      const move = await service.getBestMove(grid, 'X', 'O');
      expect(move.row).toBeDefined();
      expect(move.col).toBeDefined();
    });
  });
});
