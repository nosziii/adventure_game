import { Module } from '@nestjs/common'
import { PassportModule } from '@nestjs/passport'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { AuthModule } from './auth/auth.module'
import { UsersModule } from './users/users.module'
import { DatabaseModule } from './database/database.module'
import { ConfigModule } from '@nestjs/config'
import { UsersController } from './users/users.controller'
import { GameModule } from './game/game.module'
import { CharacterModule } from './character.module'
import { CharacterService } from './character.service'
import { CharacterController } from './character.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), 
    DatabaseModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    AuthModule,
    UsersModule,
    GameModule,
    CharacterModule,
  ],
  controllers: [AppController, UsersController, CharacterController],
  providers: [AppService, CharacterService],
})
export class AppModule {}
