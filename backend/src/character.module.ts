import { Module } from '@nestjs/common';
import { CharacterService } from './character.service';
// Itt nem kell controller egyelőre

@Module({
  providers: [CharacterService],
  exports: [CharacterService] // Exportáljuk, hogy más modulok (pl. GameModule) használhassák
})
export class CharacterModule {}