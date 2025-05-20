// src/character.controller.ts
import {
  Controller,
  Post,
  Body,
  Request,
  UseGuards,
  Logger,
  ValidationPipe,
  Param,
  ParseIntPipe,
} from '@nestjs/common'; // Szükséges importok
import { AuthGuard } from '@nestjs/passport';
import { CharacterService } from './character.service';
import { CharacterStatsDto } from './game/dto/character-stats.dto'; // Használjuk a meglévő DTO-t a válaszhoz
import { IsInt, IsNotEmpty, IsIn } from 'class-validator'; // Validációhoz
import { GameService } from './game/game.service';
import { GameStateDto } from './game/dto/game-state.dto';

// DTO az equip kéréshez
class EquipItemDto {
  @IsNotEmpty()
  @IsInt()
  itemId: number;
}

// DTO az unequip kéréshez
class UnequipItemDto {
  @IsNotEmpty()
  @IsIn(['weapon', 'armor']) // Csak ezeket a típusokat engedjük meg
  itemType: 'weapon' | 'armor';
}

@Controller('character') // Alap útvonal: /api/character
export class CharacterController {
  private readonly logger = new Logger(CharacterController.name);

  constructor(
    private readonly characterService: CharacterService,
    private readonly gameService: GameService,
  ) {}

  // --- Felszerelés Végpont ---
  @UseGuards(AuthGuard('jwt')) // Védett végpont
  @Post('equip') // POST /api/character/equip
  // A ValidationPipe automatikusan validálja a DTO-t (globálisan kell beállítani main.ts-ben!)
  async equipItem(
    @Request() req,
    @Body(ValidationPipe) body: EquipItemDto, // Használjuk a DTO-t és validáljuk
  ): Promise<CharacterStatsDto> {
    // Adjunk vissza friss statokat
    const userId = req.user.id;
    const itemId = body.itemId;
    this.logger.log(`User ${userId} requested to equip item ${itemId}`);
    // Meghívjuk a service equipItem metódusát (ami már visszaadja a friss karaktert)
    const updatedCharacterWithEffects = await this.characterService.equipItem(
      userId,
      itemId,
    );
    // Átalakítjuk DTO-vá a választ (lehetne egy külön mapper)
    return {
      health: updatedCharacterWithEffects.health,
      skill: updatedCharacterWithEffects.skill,
      luck: updatedCharacterWithEffects.luck,
      stamina: updatedCharacterWithEffects.stamina,
      name: updatedCharacterWithEffects.name,
      level: updatedCharacterWithEffects.level,
      xp: updatedCharacterWithEffects.xp,
      xpToNextLevel: updatedCharacterWithEffects.xp_to_next_level,
      defense: updatedCharacterWithEffects.defense, // Ha van védelem is
    };
  }

  // --- Levetkőzés Végpont ---
  @UseGuards(AuthGuard('jwt'))
  @Post('unequip') // POST /api/character/unequip
  async unequipItem(
    @Request() req,
    @Body(ValidationPipe) body: UnequipItemDto, // Használjuk a DTO-t és validáljuk
  ): Promise<CharacterStatsDto> {
    // Adjunk vissza friss statokat
    const userId = req.user.id;
    const itemType = body.itemType;
    this.logger.log(
      `User ${userId} requested to unequip item type ${itemType}`,
    );
    // Meghívjuk a service unequipItem metódusát
    const updatedCharacterWithEffects = await this.characterService.unequipItem(
      userId,
      itemType,
    );
    // Átalakítjuk DTO-vá a választ
    return {
      health: updatedCharacterWithEffects.health,
      skill: updatedCharacterWithEffects.skill,
      luck: updatedCharacterWithEffects.luck,
      stamina: updatedCharacterWithEffects.stamina,
      name: updatedCharacterWithEffects.name,
      level: updatedCharacterWithEffects.level,
      xp: updatedCharacterWithEffects.xp,
      xpToNextLevel: updatedCharacterWithEffects.xp_to_next_level,
      defense: updatedCharacterWithEffects.defense,
    };
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('story/:storyId/start') // POST /api/character/story/1/start
  async startStory(
    @Request() req,
    @Param('storyId', ParseIntPipe) storyId: number,
  ): Promise<GameStateDto> {
    // Visszaadjuk a teljes új játékállapotot
    const userId = req.user.id; // A req.user már tartalmazza a user id-t a JwtStrategy-ből

    // 1. Megkeressük a karaktert a user ID alapján (ez adja a characterId-t)
    const character = await this.characterService.findOrCreateByUserId(userId);
    // A findOrCreateByUserId már visszaadja az alap Character objektumot,
    // ami tartalmazza a character.id-t.

    this.logger.log(
      `User ${userId} (Character ${character.id}) requested to start/continue story ${storyId}`,
    );

    // 2. Meghívjuk a service metódust a sztori aktiválásához/létrehozásához
    // Ez frissíti a character_story_progress táblát és beállítja az is_active-ot.
    await this.characterService.startOrContinueStory(character.id, storyId);
    this.logger.log(
      `Story ${storyId} activated for character ${character.id}. Fetching initial game state.`,
    );

    // 3. Lekérjük a frissített játékállapotot a GameService-en keresztül
    // A GameService.getCurrentGameState-nek már az aktív sztori progressziót kell használnia!
    const newGameState = await this.gameService.getCurrentGameState(userId);

    return newGameState;
  }
}
