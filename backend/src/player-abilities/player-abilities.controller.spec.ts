import { Test, TestingModule } from '@nestjs/testing';
import { PlayerAbilitiesController } from './player-abilities.controller';

describe('PlayerAbilitiesController', () => {
  let controller: PlayerAbilitiesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlayerAbilitiesController],
    }).compile();

    controller = module.get<PlayerAbilitiesController>(PlayerAbilitiesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
