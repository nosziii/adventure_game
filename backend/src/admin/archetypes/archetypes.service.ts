import {
  Injectable,
  Inject,
  NotFoundException,
  Logger,
  InternalServerErrorException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Knex } from 'knex';
import { KNEX_CONNECTION } from '../../database/database.module';
import { CharacterArchetypeRecord } from '../../game/interfaces/character-archetype-record.interface';
import { CreateArchetypeDto, UpdateArchetypeDto } from './dto';

@Injectable()
export class AdminArchetypesService {
  private readonly logger = new Logger(AdminArchetypesService.name);

  constructor(@Inject(KNEX_CONNECTION) private readonly knex: Knex) {}

  // --- MAPPER SEGÉDFÜGGVÉNY: DTO (camelCase) -> DB (snake_case like) ---
  private dtoToDbArchetype(
    dto: CreateArchetypeDto | UpdateArchetypeDto,
  ): Partial<
    Omit<CharacterArchetypeRecord, 'id' | 'created_at' | 'updated_at'>
  > {
    const dbData: any = {
      // Alapértelmezett null értékek, ha kellenek, vagy a DB séma kezeli
    };

    // Name, description, iconPath, és a base...Bonus mezők
    if (dto.name !== undefined) dbData.name = dto.name;
    if (dto.description !== undefined) dbData.description = dto.description;
    if (dto.iconPath !== undefined) dbData.icon_path = dto.iconPath;
    if (dto.baseHealthBonus !== undefined)
      dbData.base_health_bonus = dto.baseHealthBonus;
    if (dto.baseSkillBonus !== undefined)
      dbData.base_skill_bonus = dto.baseSkillBonus;
    if (dto.baseLuckBonus !== undefined)
      dbData.base_luck_bonus = dto.baseLuckBonus;
    if (dto.baseStaminaBonus !== undefined)
      dbData.base_stamina_bonus = dto.baseStaminaBonus;
    if (dto.baseDefenseBonus !== undefined)
      dbData.base_defense_bonus = dto.baseDefenseBonus;

    // startingAbilityIds
    if (dto.startingAbilityIds !== undefined) {
      // Az UpdateArchetypeDto-ban is léteznie kell opcionálisként
      dbData.starting_ability_ids =
        dto.startingAbilityIds === null
          ? null
          : JSON.stringify(dto.startingAbilityIds);
    }

    // learnableAbilityIds
    if (dto.learnableAbilityIds !== undefined) {
      // Az UpdateArchetypeDto-ban is léteznie kell opcionálisként
      dbData.learnable_ability_ids =
        dto.learnableAbilityIds === null
          ? null
          : JSON.stringify(dto.learnableAbilityIds);
    }
    return dbData;
  }

  async findAll(): Promise<CharacterArchetypeRecord[]> {
    this.logger.log('Fetching all character archetypes for admin');
    return this.knex<CharacterArchetypeRecord>('character_archetypes')
      .select('*')
      .orderBy('id');
  }

  async findOne(id: number): Promise<CharacterArchetypeRecord> {
    this.logger.log(`Workspaceing character archetype with ID: ${id}`);
    const archetype = await this.knex<CharacterArchetypeRecord>(
      'character_archetypes',
    )
      .where({ id })
      .first();
    if (!archetype) {
      this.logger.warn(`Character archetype with ID ${id} not found.`);
      throw new NotFoundException(
        `Character archetype with ID ${id} not found.`,
      );
    }
    return archetype;
  }

  // --- Archetype Létrehozása ---
  async create(
    createArchetypeDto: CreateArchetypeDto,
  ): Promise<CharacterArchetypeRecord> {
    this.logger.log(
      `Attempting to create new archetype with name: ${createArchetypeDto.name}`,
    );
    const dbArchetypeData = this.dtoToDbArchetype(createArchetypeDto);
    try {
      const [newArchetype] = await this.knex('character_archetypes')
        .insert(dbArchetypeData)
        .returning('*');
      this.logger.log(`Archetype created with ID: ${newArchetype.id}`);
      return newArchetype;
    } catch (error: any) {
      this.logger.error(`Failed to create archetype: ${error}`, error.stack);
      if (
        error.code === '23505' &&
        error.constraint === 'character_archetypes_name_key'
      ) {
        // PostgreSQL unique violation on name
        throw new ConflictException(
          `Archetype with name '${createArchetypeDto.name}' already exists.`,
        );
      }
      // TODO: Ellenőrizni, hogy a starting_ability_ids-ben lévő ID-k léteznek-e az abilities táblában, ha szükséges.
      // Ezt a DTO validációban vagy itt lehetne megtenni.
      throw new InternalServerErrorException('Failed to create archetype.');
    }
  }

  // --- Archetype Frissítése ---
  async update(
    id: number,
    updateArchetypeDto: UpdateArchetypeDto,
  ): Promise<CharacterArchetypeRecord> {
    this.logger.log(`Attempting to update archetype with ID: ${id}`);
    const dbArchetypeUpdates = this.dtoToDbArchetype(updateArchetypeDto);

    if (Object.keys(dbArchetypeUpdates).length === 0) {
      this.logger.warn(`Update called for archetype ${id} with empty data.`);
      return this.findOne(id);
    }

    try {
      // Ha a starting_ability_ids null-ra van állítva a DTO-ban, akkor a DB-ben is null lesz.
      // Ha üres tömb [], akkor az üres JSON tömb lesz.
      if (updateArchetypeDto.startingAbilityIds === null) {
        dbArchetypeUpdates.starting_ability_ids = null;
      }

      const [updatedArchetype] = await this.knex('character_archetypes')
        .where({ id })
        .update(dbArchetypeUpdates)
        .returning('*');
      if (!updatedArchetype) {
        this.logger.warn(`Archetype with ID ${id} not found for update.`);
        throw new NotFoundException(`Archetype with ID ${id} not found.`);
      }
      this.logger.log(`Archetype ${id} updated successfully.`);
      return updatedArchetype;
    } catch (error: any) {
      this.logger.error(
        `Failed to update archetype ${id}: ${error}`,
        error.stack,
      );
      if (
        error.code === '23505' &&
        error.constraint === 'character_archetypes_name_key'
      ) {
        throw new ConflictException(
          `An archetype with the new name might already exist.`,
        );
      }
      throw new InternalServerErrorException('Failed to update archetype.');
    }
  }

  // --- Archetype Törlése ---
  async remove(id: number): Promise<void> {
    this.logger.log(`Attempting to remove archetype with ID: ${id}`);
    try {
      // Jelenleg nincs olyan tábla, ami közvetlenül az character_archetypes.id-ra hivatkozna
      // olyan FK constraint-tel, ami megakadályozná a törlést.
      // Ha a jövőben a 'characters' tábla kapna egy 'archetype_id'-t, akkor ott kellene kezelni.
      const numDeleted = await this.knex('character_archetypes')
        .where({ id })
        .del();
      if (numDeleted === 0) {
        this.logger.warn(`Archetype with ID ${id} not found for removal.`);
        throw new NotFoundException(`Archetype with ID ${id} not found.`);
      }
      this.logger.log(`Archetype ${id} removed successfully.`);
    } catch (error: any) {
      this.logger.error(
        `Failed to remove archetype ${id}: ${error}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to remove archetype.');
    }
  }
}
