import { Module } from '@nestjs/common'
import { GameController } from './game.controller'
import { GameService } from './game.service'
import { AuthModule } from '../auth/auth.module'
import { CharacterModule } from '../character.module'

@Module({
    imports: [
        AuthModule, 
        CharacterModule
    ],
    controllers: [GameController],
    providers: [GameService]
})
export class GameModule {}
