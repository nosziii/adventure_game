import { Module, forwardRef } from '@nestjs/common';
import { GameController } from './game.controller';
import { GameService } from './game.service';
import { AuthModule } from '../auth/auth.module';
import { CharacterModule } from '../character.module';
import { CombatModule } from '../combat.module';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    CombatModule,
    forwardRef(() => CharacterModule),
  ],
  controllers: [GameController],
  providers: [GameService],
  exports: [GameService],
})
export class GameModule {}
