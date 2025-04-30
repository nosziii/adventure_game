import { Controller, Get, Logger, Request, UseGuards, Post, Body} from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { GameService } from './game.service'
import { GameStateDto } from './dto/game-state.dto'
import { MakeChoiceDto } from './dto/make-choice.dto'
import { CombatActionDto } from './dto/combat-action.dto'

@Controller('game')
export class GameController {
  private readonly logger = new Logger(GameController.name)

  constructor(private readonly gameService: GameService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get('state')
  async getGameState(@Request() req): Promise<GameStateDto> {

    // Ha a globális guard lefutott, a req.user-nek itt léteznie kell
    if (!req.user || !req.user.id) {
         this.logger.error('User not found on request after global guard!')
    }
    const userId = req.user?.id
    if(!userId) {
        // Kezeljük le, ha mégsem lenne userId
         this.logger.error('Cannot proceed without userId!')
         throw new Error('UserID not found after guard.')
    }
    return this.gameService.getCurrentGameState(userId)
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('choice')
  async makeChoice(
    @Request() req,
    @Body() makeChoiceDto: MakeChoiceDto
  ): Promise<GameStateDto> {
    const userId = req.user.id;
    const choiceId = makeChoiceDto.choiceId;
    this.logger.log(`Received request to make choice ID: ${choiceId} from user ID: ${userId}`);
    return this.gameService.makeChoice(userId, choiceId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('combat/action')
  async handleCombatAction(
    @Request() req,
    @Body() combatActionDto: CombatActionDto // Fogadjuk az akció DTO-t
  ): Promise<GameStateDto> { // Vagy egy specifikus CombatResultDto? Maradjunk GameStateDto-nál.
    const userId = req.user.id;
    this.logger.log(`Received combat action: ${combatActionDto.action} from user ID: ${userId}`);
    // Meghívjuk a service megfelelő metódusát
    return this.gameService.handleCombatAction(userId, combatActionDto);
  }
}