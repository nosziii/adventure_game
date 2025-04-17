// src/character.service.ts
import { Injectable, Inject, NotFoundException, Logger, InternalServerErrorException } from '@nestjs/common';
import { Knex } from 'knex';
import { KNEX_CONNECTION } from './database/database.module'; // Ellenőrizd az útvonalat!

// Használjuk ugyanazt a Character interfészt, mint a GameService-ben,
// vagy hozzunk létre egy közös típust / helyezzük át egy types fájlba.
// Most másoljuk ide a teljesség kedvéért:
export interface Character {
    id: number;
    user_id: number;
    name: string | null;
    health: number;
    skill: number;
    luck: number | null; // Új statok
    stamina: number | null; // Új statok
    current_node_id: number | null;
    created_at: Date;
    updated_at: Date;
}

const STARTING_NODE_ID = 1; // Ezt is átvehetjük vagy közös helyre tehetjük

@Injectable()
export class CharacterService {
  private readonly logger = new Logger(CharacterService.name);

  constructor(@Inject(KNEX_CONNECTION) private readonly knex: Knex) {}

  // Karakter lekérdezése userId alapján
  async findByUserId(userId: number): Promise<Character | undefined> {
    this.logger.debug(`Finding character for user ID: ${userId}`);
    return this.knex<Character>('characters')
               .where({ user_id: userId })
               .first();
  }

   // Karakter lekérdezése ID alapján (ezt használta a JwtStrategy)
  async findById(id: number): Promise<Character | undefined> {
     this.logger.debug(`Finding character by ID: ${id}`);
     return this.knex<Character>('characters')
             .where({ id: id })
             .first();
   }

  // Új karakter létrehozása
  async createCharacter(userId: number): Promise<Character> {
    this.logger.log(`Creating new character for user ID: ${userId}.`);
    const defaultHealth = 100;
    const defaultSkill = 10;
    const defaultLuck = 5;
    const defaultStamina = 100;

    try {
      const [newCharacter] = await this.knex('characters')
        .insert({
          user_id: userId,
          current_node_id: STARTING_NODE_ID,
          health: defaultHealth,
          skill: defaultSkill,
          luck: defaultLuck,
          stamina: defaultStamina,
          name: 'Kalandor', // Alap név
        })
        .returning('*'); // Visszakérjük az új karakter minden adatát

      this.logger.log(`New character created with ID: ${newCharacter.id} for user ID: ${userId}`);
      return newCharacter;
    } catch (error) {
        this.logger.error(`Failed to create character for user ${userId}: ${error}`, error.stack);
        throw new InternalServerErrorException('Could not create character.');
    }
  }

  // Karakter frissítése (pl. node ID vagy statok)
  // A 'Partial<Character>' lehetővé teszi, hogy csak a módosítandó mezőket adjuk át
  async updateCharacter(characterId: number, updates: Partial<Omit<Character, 'id' | 'user_id' | 'created_at' | 'updated_at'>>): Promise<Character> {
     this.logger.debug(`Updating character ID: ${characterId} with data: ${JSON.stringify(updates)}`);
     const [updatedCharacter] = await this.knex('characters')
        .where({ id: characterId })
        .update(updates)
        .returning('*');

     if (!updatedCharacter) {
         this.logger.error(`Failed to update character ${characterId}, character not found after update attempt.`);
         throw new NotFoundException(`Character with ID ${characterId} not found for update.`);
     }
      this.logger.debug(`Character ${characterId} updated successfully.`);
     return updatedCharacter;
  }
}