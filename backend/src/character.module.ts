import { Module } from '@nestjs/common';
import { CharacterService } from './character.service'
import { CharacterController } from './character.controller'
// Itt nem kell controller egyelőre

@Module({
  providers: [CharacterService],
  exports: [CharacterService], // Exportáljuk, hogy más modulok (pl. GameModule) használhassák
  controllers: [CharacterController], // Itt is megadjuk a controllert
})
export class CharacterModule {}