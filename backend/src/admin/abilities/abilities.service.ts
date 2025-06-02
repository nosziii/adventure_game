// src/admin/abilities/admin-abilities.service.ts
import {
  Injectable,
  Inject,
  NotFoundException,
  Logger,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Knex } from 'knex';
import { KNEX_CONNECTION } from '../../database/database.module';
import { AbilityRecord } from '../../game/interfaces/ability-record.interface'; // Import
import { CreateAbilityDto, UpdateAbilityDto, AbilityType } from './dto';

@Injectable()
export class AdminAbilitiesService {
  private readonly logger = new Logger(AdminAbilitiesService.name);

  constructor(@Inject(KNEX_CONNECTION) private readonly knex: Knex) {}

  private dtoToDbAbility(
    dto: CreateAbilityDto | UpdateAbilityDto,
  ): Partial<Omit<AbilityRecord, 'id' | 'created_at' | 'updated_at'>> {
    const dbData: any = {};
    if (dto.name !== undefined) dbData.name = dto.name;
    if (dto.description !== undefined) dbData.description = dto.description;
    if (dto.type !== undefined) dbData.type = dto.type;
    if (dto.effectString !== undefined) dbData.effect_string = dto.effectString;
    if (dto.talentPointCost !== undefined)
      dbData.talent_point_cost = dto.talentPointCost;
    if (dto.levelRequirement !== undefined)
      dbData.level_requirement = dto.levelRequirement;
    // A prerequisites JSONB, ha a DTO stringként küldi a JSON-t, a DB driver kezeli. Ha objektum, akkor is.
    if (dto.prerequisites !== undefined) {
      dbData.prerequisites =
        dto.prerequisites === null ? null : JSON.stringify(dto.prerequisites);
    }
    if (dto.allowedArchetypeIds !== undefined) {
      dbData.allowed_archetype_ids =
        dto.allowedArchetypeIds === null
          ? null
          : JSON.stringify(dto.allowedArchetypeIds);
    }
    return dbData;
  }

  async findAll(): Promise<AbilityRecord[]> {
    this.logger.log('Fetching all abilities for admin');
    return this.knex<AbilityRecord>('abilities').select('*').orderBy('id');
  }

  async findOne(id: number): Promise<AbilityRecord> {
    this.logger.log(`Workspaceing ability with ID: ${id}`);
    const ability = await this.knex<AbilityRecord>('abilities')
      .where({ id })
      .first();
    if (!ability) {
      this.logger.warn(`Ability with ID ${id} not found.`);
      throw new NotFoundException(`Ability with ID ${id} not found.`);
    }
    return ability;
  }

  // --- Ability Létrehozása ---
  async create(createAbilityDto: CreateAbilityDto): Promise<AbilityRecord> {
    this.logger.log(
      `Attempting to create new ability with name: ${createAbilityDto.name}`,
    );
    const dbAbilityData = this.dtoToDbAbility(createAbilityDto);
    try {
      const [newAbility] = await this.knex('abilities')
        .insert(dbAbilityData)
        .returning('*');
      this.logger.log(`Ability created with ID: ${newAbility.id}`);
      return newAbility;
    } catch (error: any) {
      this.logger.error(`Failed to create ability: ${error}`, error.stack);
      if (error.code === '23505' && error.constraint === 'abilities_name_key') {
        // PostgreSQL unique violation on name
        throw new ConflictException(
          `Ability with name '${createAbilityDto.name}' already exists.`,
        );
      }
      // Itt lehetne más FK hibákat is ellenőrizni, ha lennének (pl. prerequisites ability ID-k létezése)
      throw new InternalServerErrorException('Failed to create ability.');
    }
  }

  // --- Ability Frissítése ---
  async update(
    id: number,
    updateAbilityDto: UpdateAbilityDto,
  ): Promise<AbilityRecord> {
    this.logger.log(`Attempting to update ability with ID: ${id}`);
    const dbAbilityUpdates = this.dtoToDbAbility(updateAbilityDto);

    if (Object.keys(dbAbilityUpdates).length === 0) {
      this.logger.warn(`Update called for ability ${id} with empty data.`);
      return this.findOne(id); // Visszaadjuk a meglévőt
    }

    try {
      const [updatedAbility] = await this.knex('abilities')
        .where({ id })
        .update(dbAbilityUpdates)
        .returning('*');
      if (!updatedAbility) {
        this.logger.warn(`Ability with ID ${id} not found for update.`);
        throw new NotFoundException(`Ability with ID ${id} not found.`);
      }
      this.logger.log(`Ability ${id} updated successfully.`);
      return updatedAbility;
    } catch (error: any) {
      this.logger.error(
        `Failed to update ability ${id}: ${error}`,
        error.stack,
      );
      if (error.code === '23505' && error.constraint === 'abilities_name_key') {
        throw new ConflictException(
          `An ability with the new name might already exist.`,
        );
      }
      throw new InternalServerErrorException('Failed to update ability.');
    }
  }

  // --- Ability Törlése ---
  async remove(id: number): Promise<void> {
    this.logger.log(`Attempting to remove ability with ID: ${id}`);
    try {
      // Az ON DELETE CASCADE miatt a character_story_abilities táblából a hivatkozások törlődni fognak.
      const numDeleted = await this.knex('abilities').where({ id }).del();
      if (numDeleted === 0) {
        this.logger.warn(`Ability with ID ${id} not found for removal.`);
        throw new NotFoundException(`Ability with ID ${id} not found.`);
      }
      this.logger.log(`Ability ${id} removed successfully.`);
    } catch (error: any) {
      this.logger.error(
        `Failed to remove ability ${id}: ${error}`,
        error.stack,
      );
      // Ha a jövőben más tábla hivatkozna az abilities.id-ra RESTRICT-tel, itt lehetne ConflictException
      throw new InternalServerErrorException('Failed to remove ability.');
    }
  }
}
