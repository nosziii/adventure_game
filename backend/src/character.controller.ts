// src/character.controller.ts
import {
  Controller,
  Post,
  Body,
  Request,
  UseGuards,
  Logger,
  ValidationPipe,
} from '@nestjs/common'; // Szükséges importok
import { AuthGuard } from '@nestjs/passport';
import { CharacterService } from './character.service';
import { CharacterStatsDto } from './game/dto/character-stats.dto'; // Használjuk a meglévő DTO-t a válaszhoz
import { IsInt, IsNotEmpty, IsIn } from 'class-validator'; // Validációhoz

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

  constructor(private readonly characterService: CharacterService) {}

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
}
