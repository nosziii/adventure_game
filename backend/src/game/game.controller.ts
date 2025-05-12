import {
  Controller,
  Get,
  Logger,
  Request,
  UseGuards,
  Post,
  Body,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GameService } from './game.service';
import {
  GameStateDto,
  MakeChoiceDto,
  UseItemDto,
  CharacterStatsDto,
  CombatActionDto,
  PlayerMapDataDto,
} from './dto';

@Controller('game')
export class GameController {
  private readonly logger = new Logger(GameController.name);

  constructor(private readonly gameService: GameService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get('state')
  async getGameState(@Request() req): Promise<GameStateDto> {
    // Ha a globális guard lefutott, a req.user-nek itt léteznie kell
    if (!req.user || !req.user.id) {
      this.logger.error('User not found on request after global guard!');
    }
    const userId = req.user?.id;
    if (!userId) {
      // Kezeljük le, ha mégsem lenne userId
      this.logger.error('Cannot proceed without userId!');
      throw new Error('UserID not found after guard.');
    }
    return this.gameService.getCurrentGameState(userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('choice')
  async makeChoice(
    @Request() req,
    @Body() makeChoiceDto: MakeChoiceDto,
  ): Promise<GameStateDto> {
    const userId = req.user.id;
    const choiceId = makeChoiceDto.choiceId;
    this.logger.log(
      `Received request to make choice ID: ${choiceId} from user ID: ${userId}`,
    );
    return this.gameService.makeChoice(userId, choiceId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('combat/action')
  async handleCombatAction(
    @Request() req,
    @Body() combatActionDto: CombatActionDto, // Fogadjuk az akció DTO-t
  ): Promise<GameStateDto> {
    // Vagy egy specifikus CombatResultDto? Maradjunk GameStateDto-nál.
    const userId = req.user.id;
    this.logger.log(
      `Received combat action: ${combatActionDto.action} from user ID: ${userId}`,
    );
    // Meghívjuk a service megfelelő metódusát
    return this.gameService.handleCombatAction(userId, combatActionDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('use-item') // POST /api/game/use-item
  async useItem(
    @Request() req,
    @Body() useItemDto: UseItemDto, // Fogadjuk az itemId-t
  ): Promise<CharacterStatsDto> {
    // Csak a frissített statokat adjuk vissza
    const userId = req.user.id;
    const itemId = useItemDto.itemId;
    this.logger.log(
      `Received request to use item ID: ${itemId} from user ID: ${userId} (out of combat)`,
    );
    // Meghívjuk a service megfelelő metódusát
    return this.gameService.useItemOutOfCombat(userId, itemId);
  }

  @UseGuards(AuthGuard('jwt')) // Védett végpont
  @Get('map-progress') // GET /api/game/map-progress
  async getPlayerMapProgress(@Request() req): Promise<PlayerMapDataDto> {
    const userId = req.user.id; // A user ID-t a JWT payloadból kapjuk
    this.logger.log(
      `Received request for player map progress from user ID: ${userId}`,
    );
    return this.gameService.getPlayerProgress(userId);
  }
}
