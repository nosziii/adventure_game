// src/admin/enemies/admin-enemies.service.ts
import {
  Injectable,
  Inject,
  NotFoundException,
  Logger,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Knex } from 'knex';
import { KNEX_CONNECTION } from '../../database/database.module';
import { EnemyRecord } from '../../game/interfaces/enemy-record.interface'; // Import
import { CreateEnemyDto, UpdateEnemyDto } from './dto'; // Importáld a DTO-kat

@Injectable()
export class AdminEnemiesService {
  private readonly logger = new Logger(AdminEnemiesService.name);

  constructor(@Inject(KNEX_CONNECTION) private readonly knex: Knex) {}

  private dtoToDbEnemy(
    dto: CreateEnemyDto | UpdateEnemyDto,
  ): Partial<Omit<EnemyRecord, 'id' | 'created_at' | 'updated_at'>> {
    const dbData: any = {};
    if (dto.name !== undefined) dbData.name = dto.name;
    if (dto.health !== undefined) dbData.health = dto.health;
    if (dto.skill !== undefined) dbData.skill = dto.skill;
    if (dto.attackDescription !== undefined)
      dbData.attack_description = dto.attackDescription;
    if (dto.defeatText !== undefined) dbData.defeat_text = dto.defeatText;
    if (dto.itemDropId !== undefined) dbData.item_drop_id = dto.itemDropId;
    if (dto.xpReward !== undefined) dbData.xp_reward = dto.xpReward;

    // a védekezés használata
    if (dto.specialAttackName !== undefined)
      dbData.special_attack_name = dto.specialAttackName;
    if (dto.specialAttackDamageMultiplier !== undefined)
      dbData.special_attack_damage_multiplier =
        dto.specialAttackDamageMultiplier;
    if (dto.specialAttackChargeTurns !== undefined)
      dbData.special_attack_charge_turns = dto.specialAttackChargeTurns;
    if (dto.specialAttackTelegraphText !== undefined)
      dbData.special_attack_telegraph_text = dto.specialAttackTelegraphText;
    if (dto.specialAttackExecuteText !== undefined)
      dbData.special_attack_execute_text = dto.specialAttackExecuteText;
    return dbData;
  }

  async findAll(): Promise<EnemyRecord[]> {
    this.logger.log('Fetching all enemies for admin');
    return this.knex<EnemyRecord>('enemies').select('*').orderBy('id');
  }

  async findOne(id: number): Promise<EnemyRecord> {
    this.logger.log(`Workspaceing enemy with ID: ${id}`);
    const enemy = await this.knex<EnemyRecord>('enemies').where({ id }).first();
    if (!enemy) {
      this.logger.warn(`Enemy with ID ${id} not found.`);
      throw new NotFoundException(`Enemy with ID ${id} not found.`);
    }
    return enemy;
  }

  async create(createEnemyDto: CreateEnemyDto): Promise<EnemyRecord> {
    this.logger.log(
      `Attempting to create new enemy with name: ${createEnemyDto.name}`,
    );
    const dbEnemyData = this.dtoToDbEnemy(createEnemyDto);
    try {
      const [newEnemy] = await this.knex('enemies')
        .insert(dbEnemyData)
        .returning('*');
      this.logger.log(`Enemy created with ID: ${newEnemy.id}`);
      return newEnemy;
    } catch (error: any) {
      this.logger.error(`Failed to create enemy: ${error}`, error.stack);
      if (error.code === '23505') {
        // PostgreSQL unique violation (ha lenne unique constraint a névre)
        throw new ConflictException(
          `Enemy with name '${createEnemyDto.name}' might already exist or other unique constraint violation.`,
        );
      }
      if (error.code === '23503') {
        // PostgreSQL foreign key violation (pl. item_drop_id nem létező itemre mutat)
        throw new BadRequestException(
          'Invalid item_drop_id (item does not exist).',
        );
      }
      throw new InternalServerErrorException('Failed to create enemy.');
    }
  }

  // --- ÚJ METÓDUS: Enemy Frissítése ---
  async update(
    id: number,
    updateEnemyDto: UpdateEnemyDto,
  ): Promise<EnemyRecord> {
    this.logger.log(`Attempting to update enemy with ID: ${id}`);
    const dbEnemyUpdates = this.dtoToDbEnemy(updateEnemyDto);

    if (Object.keys(dbEnemyUpdates).length === 0) {
      this.logger.warn(`Update called for enemy ${id} with empty data.`);
      return this.findOne(id);
    }

    try {
      const [updatedEnemy] = await this.knex('enemies')
        .where({ id })
        .update(dbEnemyUpdates)
        .returning('*');
      if (!updatedEnemy) {
        this.logger.warn(`Enemy with ID ${id} not found for update.`);
        throw new NotFoundException(`Enemy with ID ${id} not found.`);
      }
      this.logger.log(`Enemy ${id} updated successfully.`);
      return updatedEnemy;
    } catch (error: any) {
      this.logger.error(`Failed to update enemy ${id}: ${error}`, error.stack);
      if (error.code === '23503') {
        // FK violation
        throw new BadRequestException('Invalid item_drop_id for update.');
      }
      throw new InternalServerErrorException('Failed to update enemy.');
    }
  }

  // --- ÚJ METÓDUS: Enemy Törlése ---
  async remove(id: number): Promise<void> {
    this.logger.log(`Attempting to remove enemy with ID: ${id}`);
    try {
      const numDeleted = await this.knex('enemies').where({ id }).del();
      if (numDeleted === 0) {
        this.logger.warn(`Enemy with ID ${id} not found for removal.`);
        throw new NotFoundException(`Enemy with ID ${id} not found.`);
      }
      this.logger.log(`Enemy ${id} removed successfully.`);
    } catch (error: any) {
      this.logger.error(`Failed to remove enemy ${id}: ${error}`, error.stack);
      // Ellenőrizzük, hogy a hiba Foreign Key sértés miatt volt-e (pl. egy StoryNode hivatkozik rá)
      if (error.code === '23503') {
        throw new ConflictException(
          `Cannot delete enemy ${id} because other records (e.g., story nodes) depend on it.`,
        );
      }
      throw new InternalServerErrorException('Failed to remove enemy.');
    }
  }
}
