// src/player-abilities.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Request,
  UseGuards,
  Logger,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PlayerAbilitiesService } from './player-abilities.service';
import { LearnableAbilityDto, LearnAbilityRequestDto } from './dto';
import { GameService } from '../game/game.service'; // GameStateDto visszaadásához
import { GameStateDto } from '../game/dto/game-state.dto';

@Controller('player-abilities') // Alap útvonal: /api/player-abilities
@UseGuards(AuthGuard('jwt'))
export class PlayerAbilitiesController {
  private readonly logger = new Logger(PlayerAbilitiesController.name);

  constructor(
    private readonly playerAbilitiesService: PlayerAbilitiesService,
    private readonly gameService: GameService, // Injektáljuk a GameService-t
  ) {}

  @Get('learnable') // GET /api/player-abilities/learnable
  async listLearnableAbilities(@Request() req): Promise<LearnableAbilityDto[]> {
    const userId = req.user.id;
    this.logger.log(`User ${userId} requesting their learnable abilities.`);
    return this.playerAbilitiesService.getLearnableAbilities(userId);
  }

  @Post('learn') // POST /api/player-abilities/learn
  async learnNewAbility(
    @Request() req,
    @Body(ValidationPipe) learnAbilityDto: LearnAbilityRequestDto,
  ): Promise<GameStateDto> {
    // Visszaadjuk a teljes játékállapotot
    const userId = req.user.id;
    this.logger.log(
      `User ${userId} attempting to learn ability ID: ${learnAbilityDto.abilityId}`,
    );

    await this.playerAbilitiesService.learnAbility(
      userId,
      learnAbilityDto.abilityId,
    );

    this.logger.log(
      `Ability learned. Fetching updated game state for user ${userId}.`,
    );
    return this.gameService.getCurrentGameState(userId); // Frissített teljes állapot
  }
}
