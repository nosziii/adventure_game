import { Test, TestingModule } from '@nestjs/testing';
import { PlayerAbilitiesService } from './player-abilities.service';

describe('PlayerAbilitiesService', () => {
  let service: PlayerAbilitiesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PlayerAbilitiesService],
    }).compile();

    service = module.get<PlayerAbilitiesService>(PlayerAbilitiesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
