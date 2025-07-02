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
import { CreateAbilityDto, UpdateAbilityDto } from './dto';

function isDatabaseError(error: unknown): error is {
  code: string;
  constraint: string;
  message: string;
  stack?: string;
} {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'constraint' in error &&
    'message' in error
  );
}

@Injectable()
export class AdminAbilitiesService {
  private readonly logger = new Logger(AdminAbilitiesService.name);

  constructor(@Inject(KNEX_CONNECTION) private readonly knex: Knex) {}

  private dtoToDbAbility(
    dto: CreateAbilityDto | UpdateAbilityDto,
  ): Partial<AbilityRecord> {
    const dbData: Partial<AbilityRecord> = {};
    if (dto.name !== undefined) dbData.name = dto.name;
    if (dto.description !== undefined) dbData.description = dto.description;
    if (dto.type !== undefined) dbData.type = dto.type;
    if (dto.effectString !== undefined) dbData.effect_string = dto.effectString;
    if (dto.talentPointCost !== undefined)
      dbData.talent_point_cost = dto.talentPointCost;
    if (dto.levelRequirement !== undefined)
      dbData.level_requirement = dto.levelRequirement;
    if (dto.prerequisites !== undefined) {
      dbData.prerequisites = dto.prerequisites;
    }
    if (dto.allowedArchetypeIds !== undefined) {
      dbData.allowed_archetype_ids = dto.allowedArchetypeIds;
    }
    return dbData;
  }

  async findAll(): Promise<AbilityRecord[]> {
    this.logger.log('Fetching all abilities for admin');
    return this.knex<AbilityRecord>('abilities').select('*').orderBy('id');
  }

  async findOne(id: number): Promise<AbilityRecord> {
    this.logger.log(`Finding ability with ID: ${id}`);
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
        .returning<AbilityRecord[]>('*');
      if (!newAbility) {
        throw new InternalServerErrorException('Failed to create ability.');
      }
      this.logger.log(`Ability created with ID: ${newAbility.id}`);
      return newAbility;
    } catch (error: unknown) {
      if (isDatabaseError(error)) {
        this.logger.error(
          `Failed to create ability: ${error.message}`,
          error.stack,
        );
        if (
          error.code === '23505' &&
          error.constraint === 'abilities_name_key'
        ) {
          throw new ConflictException(
            `Ability with name '${createAbilityDto.name}' already exists.`,
          );
        }
      }
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
      return this.findOne(id);
    }

    try {
      const [updatedAbility] = await this.knex('abilities')
        .where({ id })
        .update(dbAbilityUpdates)
        .returning<AbilityRecord[]>('*');
      if (!updatedAbility) {
        this.logger.warn(`Ability with ID ${id} not found for update.`);
        throw new NotFoundException(`Ability with ID ${id} not found.`);
      }
      this.logger.log(`Ability ${id} updated successfully.`);
      return updatedAbility;
    } catch (error: unknown) {
      if (isDatabaseError(error)) {
        this.logger.error(
          `Failed to update ability ${id}: ${error.message}`,
          error.stack,
        );
        if (
          error.code === '23505' &&
          error.constraint === 'abilities_name_key'
        ) {
          throw new ConflictException(
            `An ability with the new name might already exist.`,
          );
        }
      }
      throw new InternalServerErrorException('Failed to update ability.');
    }
  }

  // --- Ability Törlése ---
  async remove(id: number): Promise<void> {
    this.logger.log(`Attempting to remove ability with ID: ${id}`);
    try {
      const numDeleted = await this.knex('abilities').where({ id }).del();
      if (numDeleted === 0) {
        this.logger.warn(`Ability with ID ${id} not found for removal.`);
        throw new NotFoundException(`Ability with ID ${id} not found.`);
      }
      this.logger.log(`Ability ${id} removed successfully.`);
    } catch (error: unknown) {
      if (isDatabaseError(error)) {
        this.logger.error(
          `Failed to remove ability ${id}: ${error.message}`,
          error.stack,
        );
      }
      throw new InternalServerErrorException('Failed to remove ability.');
    }
  }
}
