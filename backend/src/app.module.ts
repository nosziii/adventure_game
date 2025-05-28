import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from '@nestjs/config';
import { UsersController } from './users/users.controller';
import { GameModule } from './game/game.module';
import { CharacterModule } from './character.module';
import { CharacterService } from './character.service';
import { CharacterController } from './character.controller';
import { AdminModule } from './admin/admin.module';
import { CombatModule } from './combat.module';
import { CombatService } from './combat.service';
import { PlayerAbilitiesModule } from './player-abilities/player-abilities.module';
// import { PlayerAbilitiesService } from './player-abilities/player-abilities.service';
// import { PlayerAbilitiesController } from './player-abilities/player-abilities.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    AuthModule,
    UsersModule,
    GameModule,
    CharacterModule,
    AdminModule,
    CombatModule,
    PlayerAbilitiesModule,
  ],
  controllers: [
    AppController,
    UsersController,
    CharacterController,
    // PlayerAbilitiesController,
  ],
  providers: [
    AppService,
    CharacterService,
    CombatService,
    // PlayerAbilitiesService,
  ],
})
export class AppModule {}
