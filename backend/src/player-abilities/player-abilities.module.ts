// src/player-abilities.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { PlayerAbilitiesService } from './player-abilities.service';
import { PlayerAbilitiesController } from './player-abilities.controller';
import { CharacterModule } from '../character.module'; // CharacterService kell
import { GameModule } from '../game/game.module'; // GameService kell

@Module({
  imports: [forwardRef(() => CharacterModule), forwardRef(() => GameModule)],
  controllers: [PlayerAbilitiesController],
  providers: [PlayerAbilitiesService],
})
export class PlayerAbilitiesModule {}
