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
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common'; // Szükséges importok
import { AuthGuard } from '@nestjs/passport';
import { CharacterService, Character } from './character.service';
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
@UseGuards(AuthGuard('jwt'))
export class CharacterController {
  private readonly logger = new Logger(CharacterController.name);

  constructor(
    private readonly characterService: CharacterService,
    private readonly gameService: GameService,
  ) {}

  // --- Felszerelés Végpont ---
  @Post('equip')
  async equipItem(
    // Átneveztem, hogy ne legyen equip az osztályban és a metódus neve is
    @Request() req,
    @Body(ValidationPipe) body: EquipItemDto,
  ): Promise<CharacterStatsDto> {
    const userId = req.user.id;
    const itemId = body.itemId;
    this.logger.log(`User ${userId} requested to equip item ${itemId}`);

    // 1. Karakter alap adatainak lekérése (névhez kell)
    const baseCharacter =
      await this.characterService.findOrCreateByUserId(userId);

    // 2. Felszerelés végrehajtása, ez CharacterStoryProgressRecord-ot ad vissza
    const updatedProgress = await this.characterService.equipItem(
      baseCharacter.id,
      itemId,
    );

    // 3. Passzív effektek újraalkalmazása a frissített progress alapján
    // Ehhez össze kell állítani egy 'Character' típusú objektumot a baseCharacter és updatedProgress alapján
    let characterWithEffects: Character = {
      ...baseCharacter,
      health: updatedProgress.health,
      skill: updatedProgress.skill,
      luck: updatedProgress.luck,
      stamina: updatedProgress.stamina,
      defense: updatedProgress.defense,
      level: updatedProgress.level,
      xp: updatedProgress.xp,
      xp_to_next_level: updatedProgress.xp_to_next_level,
      current_node_id: updatedProgress.current_node_id,
      equipped_weapon_id: updatedProgress.equipped_weapon_id,
      equipped_armor_id: updatedProgress.equipped_armor_id,
    };
    characterWithEffects =
      await this.characterService.applyPassiveEffects(characterWithEffects);

    // 4. CharacterStatsDto összeállítása
    return {
      health: characterWithEffects.health,
      skill: characterWithEffects.skill,
      luck: characterWithEffects.luck,
      stamina: characterWithEffects.stamina,
      name: baseCharacter.name, // A nevet a baseCharacter-ből vesszük!
      level: characterWithEffects.level,
      xp: characterWithEffects.xp,
      xpToNextLevel: characterWithEffects.xp_to_next_level, // Figyelj a snake_case vs camelCase-re itt is
      defense: characterWithEffects.defense,
    };
  }

  @Post('unequip')
  async unequip(
    // Átneveztem
    @Request() req,
    @Body(ValidationPipe) body: UnequipItemDto,
  ): Promise<CharacterStatsDto> {
    const userId = req.user.id;
    const itemType = body.itemType;
    this.logger.log(
      `User ${userId} requested to unequip item type ${itemType}`,
    );

    const baseCharacter =
      await this.characterService.findOrCreateByUserId(userId);
    const updatedProgress = await this.characterService.unequipItem(
      baseCharacter.id,
      itemType,
    );

    let characterWithEffects: Character = {
      ...baseCharacter,
      health: updatedProgress.health,
      skill: updatedProgress.skill,
      luck: updatedProgress.luck,
      stamina: updatedProgress.stamina,
      defense: updatedProgress.defense,
      level: updatedProgress.level,
      xp: updatedProgress.xp,
      xp_to_next_level: updatedProgress.xp_to_next_level,
      current_node_id: updatedProgress.current_node_id,
      equipped_weapon_id: updatedProgress.equipped_weapon_id,
      equipped_armor_id: updatedProgress.equipped_armor_id,
    };
    characterWithEffects =
      await this.characterService.applyPassiveEffects(characterWithEffects);

    return {
      health: characterWithEffects.health,
      skill: characterWithEffects.skill,
      luck: characterWithEffects.luck,
      stamina: characterWithEffects.stamina,
      name: baseCharacter.name, // A nevet a baseCharacter-ből vesszük!
      level: characterWithEffects.level,
      xp: characterWithEffects.xp,
      xpToNextLevel: characterWithEffects.xp_to_next_level,
      defense: characterWithEffects.defense,
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

  // --- ÚJ VÉGPONT: Sztori Haladásának Resetelése ---
  @Post('story/:storyId/reset') // POST /api/character/story/1/reset
  @HttpCode(HttpStatus.NO_CONTENT) // 204 No Content sikeres esetben
  async resetStory(
    @Request() req,
    @Param('storyId', ParseIntPipe) storyId: number,
  ): Promise<void> {
    // Nem adunk vissza tartalmat
    const userId = req.user.id;
    const character = await this.characterService.findOrCreateByUserId(userId);
    if (!character) {
      // Ennek nem szabadna előfordulnia a findOrCreateByUserId miatt
      throw new NotFoundException('Character not found for this user.');
    }

    this.logger.log(
      `User ${userId} (Character ${character.id}) requested to reset story ${storyId}`,
    );
    await this.characterService.resetStoryProgress(character.id, storyId);
    // Nincs visszatérési érték, a 204-et a @HttpCode állítja be
  }
}
