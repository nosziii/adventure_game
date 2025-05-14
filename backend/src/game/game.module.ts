import { Module } from '@nestjs/common';
import { GameController } from './game.controller';
import { GameService } from './game.service';
import { AuthModule } from '../auth/auth.module';
import { CharacterModule } from '../character.module';
import { CombatModule } from '../combat.module';

@Module({
  imports: [AuthModule, CharacterModule, CombatModule],
  controllers: [GameController],
  providers: [GameService],
})
export class GameModule {}
