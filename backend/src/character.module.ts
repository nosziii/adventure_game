import { Module, forwardRef } from '@nestjs/common';
import { CharacterService } from './character.service';
import { CharacterController } from './character.controller';
import { GameModule } from './game/game.module';
// Itt nem kell controller egyelőre

@Module({
  imports: [forwardRef(() => GameModule)],
  providers: [CharacterService],
  exports: [CharacterService], // Exportáljuk, hogy más modulok (pl. GameModule) használhassák
  controllers: [CharacterController], // Itt is megadjuk a controllert
})
export class CharacterModule {}
