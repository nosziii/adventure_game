// src/admin/items/admin-items.service.ts
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
import { ItemRecord } from '../../game/interfaces/item-record.interface'; // Importáld
import { CreateItemDto, UpdateItemDto } from './dto';

@Injectable()
export class AdminItemsService {
  private readonly logger = new Logger(AdminItemsService.name);

  constructor(@Inject(KNEX_CONNECTION) private readonly knex: Knex) {}

  async findAll(): Promise<ItemRecord[]> {
    this.logger.log('Fetching all items for admin');
    return this.knex<ItemRecord>('items').select('*').orderBy('id');
  }

  async findOne(id: number): Promise<ItemRecord> {
    this.logger.log(`Workspaceing item with ID: ${id}`);
    const item = await this.knex<ItemRecord>('items').where({ id }).first();
    if (!item) {
      this.logger.warn(`Item with ID ${id} not found.`);
      throw new NotFoundException(`Item with ID ${id} not found.`);
    }
    return item;
  }

  async create(createItemDto: CreateItemDto): Promise<ItemRecord> {
    this.logger.log(
      `Attempting to create new item with name: ${createItemDto.name}`,
    );
    try {
      // A CreateItemDto mezőnevei várhatóan megegyeznek a DB oszlopnevekkel
      // vagy a Knex kezeli a snake_case konverziót, ha be van állítva globálisan (most nincs)
      // Ha nem, akkor itt kellene egy dtoToDbItem mapper. Tegyük fel, egyeznek.
      const [newItem] = await this.knex('items')
        .insert(createItemDto) // Közvetlenül átadjuk a DTO-t
        .returning('*');
      this.logger.log(`Item created with ID: ${newItem.id}`);
      return newItem;
    } catch (error: any) {
      this.logger.error(`Failed to create item: ${error}`, error.stack);
      if (error.code === '23505') {
        // PostgreSQL unique violation (pl. name)
        throw new ConflictException(
          `Item with name '${createItemDto.name}' already exists.`,
        );
      }
      throw new InternalServerErrorException('Failed to create item.');
    }
  }

  // --- ÚJ METÓDUS: Item Frissítése ---
  async update(id: number, updateItemDto: UpdateItemDto): Promise<ItemRecord> {
    this.logger.log(`Attempting to update item with ID: ${id}`);

    if (Object.keys(updateItemDto).length === 0) {
      this.logger.warn(`Update called for item ${id} with empty data.`);
      return this.findOne(id); // Visszaadjuk a meglévőt
    }

    try {
      // Hasonlóan a create-hez, feltételezzük, hogy a DTO mezőnevek jók
      const [updatedItem] = await this.knex('items')
        .where({ id })
        .update(updateItemDto)
        .returning('*');
      if (!updatedItem) {
        this.logger.warn(`Item with ID ${id} not found for update.`);
        throw new NotFoundException(`Item with ID ${id} not found.`);
      }
      this.logger.log(`Item ${id} updated successfully.`);
      return updatedItem;
    } catch (error: any) {
      this.logger.error(`Failed to update item ${id}: ${error}`, error.stack);
      if (error.code === '23505') {
        // PostgreSQL unique violation (pl. name)
        throw new ConflictException(
          `An item with the new name might already exist.`,
        );
      }
      throw new InternalServerErrorException('Failed to update item.');
    }
  }

  // --- ÚJ METÓDUS: Item Törlése ---
  async remove(id: number): Promise<void> {
    this.logger.log(`Attempting to remove item with ID: ${id}`);
    try {
      const numDeleted = await this.knex('items').where({ id }).del();
      if (numDeleted === 0) {
        this.logger.warn(`Item with ID ${id} not found for removal.`);
        throw new NotFoundException(`Item with ID ${id} not found.`);
      }
      this.logger.log(`Item ${id} removed successfully.`);
    } catch (error: any) {
      this.logger.error(`Failed to remove item ${id}: ${error}`, error.stack);
      // Ellenőrizzük, hogy a hiba Foreign Key sértés miatt volt-e
      if (error.code === '23503') {
        // PostgreSQL foreign key violation
        throw new ConflictException(
          `Cannot delete item ${id} because other records (e.g., choices, enemies, inventory) depend on it.`,
        );
      }
      throw new InternalServerErrorException('Failed to remove item.');
    }
  }
}
