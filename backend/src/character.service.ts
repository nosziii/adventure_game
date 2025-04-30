// src/character.service.ts
import { Injectable, Inject, NotFoundException, Logger, InternalServerErrorException } from '@nestjs/common';
import { Knex } from 'knex';
import { KNEX_CONNECTION } from './database/database.module' // Ellenőrizd az útvonalat!
import { InventoryItem } from './types/character.interfaces'
import { InventoryItemDto } from './game/dto/inventory-item.dto'

export interface Character {
    id: number
    user_id: number
    name: string | null;
    health: number
    skill: number
    luck: number | null
    stamina: number | null
    current_node_id: number | null
    created_at: Date
    updated_at: Date
}


const STARTING_NODE_ID = 1

@Injectable()
export class CharacterService {
  private readonly logger = new Logger(CharacterService.name);

  constructor(@Inject(KNEX_CONNECTION) private readonly knex: Knex) {}

  // Karakter lekérdezése userId alapján
  async findByUserId(userId: number): Promise<Character | undefined> {
    this.logger.debug(`Finding character for user ID: ${userId}`);
    const character = await this.knex<Character>('characters')
                                  .where({ user_id: userId })
                                  .first();
        // Alkalmazzuk a passzív effekteket, mielőtt visszaadjuk
        return character ? await this.applyPassiveEffects(character) : undefined;
  }

   // Karakter lekérdezése ID alapján (ezt használta a JwtStrategy)
  async findById(id: number): Promise<Character | undefined> {
     this.logger.debug(`Finding character by ID: ${id}`);
     const character = await this.knex<Character>('characters')
                                 .where({ id: id })
                                 .first();
         return character ? await this.applyPassiveEffects(character) : undefined;
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
         throw new NotFoundException(`Character with ID ${characterId} not found for update.`)
     }
      this.logger.debug(`Character ${characterId} updated successfully.`)
     return updatedCharacter;
  }
  
  async findOrCreateByUserId(userId: number): Promise<Character> {
    let character = await this.findByUserId(userId); // Ez már az effektekkel ellátottat adja vissza, ha létezik
       if (!character) {
          this.logger.log(`Character not found for user ${userId} in findOrCreate, creating new one.`)
          const baseCharacter = await this.createCharacter(userId)
          character = await this.applyPassiveEffects(baseCharacter)
       }
       return character
  }
  
  /**
   * Lekérdezi egy karakter teljes leltárát, joinolva az item adatokkal.
   */
  async getInventory(characterId: number): Promise<InventoryItemDto[]> {
    this.logger.debug(`Workspaceing inventory for character ID: ${characterId}`);
    try {
       const inventory = await this.knex('character_inventory as ci')
            .join('items as i', 'ci.item_id', '=', 'i.id') // Összekapcsolás az items táblával
            .select<InventoryItemDto[]>(
                'ci.item_id as itemId', // Aliasok a camelCase konvencióhoz
                'ci.quantity',
                'i.name',
                'i.description',
                'i.type',
                'i.effect',
                'i.usable'
             )
            .where('ci.character_id', characterId);
        return inventory;
    } catch (error) {
         this.logger.error(`Failed to fetch inventory for character ${characterId}: ${error}`, error.stack);
         throw new InternalServerErrorException('Could not retrieve inventory.');
    }
  }
  /**
   * Lekérdezi egy karakter leltárának egy elemét, az item_id alapján.
   * Ez a metódus nem csatlakozik az items táblához, csak a character_inventory táblát használja.
   * Használható például a karakter leltárának egy adott elemének lekérdezésére.
   */
  // TODO: Később ezt is bővíteni kellene

  private async applyPassiveEffects(character: Character): Promise<Character> {
        const characterWithEffects = { ...character }; // Másolat készítése
        const inventory = await this.getInventory(character.id);

        this.logger.debug(`Applying passive effects for character ${character.id}. Inventory size: ${inventory.length}`);

        for (const item of inventory) {
            // Ellenőrizzük, hogy passzív-e a hatás (pl. fegyver, páncél)
            // Később lehetne explicit 'passive' flag az items táblában/effekt stringben
            const isPassiveType = ['weapon', 'armor', 'ring', 'amulet'].includes(item.type?.toLowerCase() ?? ''); // Típusok listája bővíthető

            if (isPassiveType && typeof item.effect === 'string' && item.effect.length > 0) {
                this.logger.debug(`Parsing passive effect "${item.effect}" from item ${item.itemId} (${item.name})`);

                // Próbáljuk értelmezni a "stat[+-]érték" formátumot (pl. "skill+2", "health-5")
                const effectRegex = /(\w+)\s*([+-])\s*(\d+)/;
                const match = item.effect.match(effectRegex);

                if (match) {
                    const [, statName, operator, valueStr] = match;
                    const value = parseInt(valueStr, 10);
                    const modifier = operator === '+' ? value : -value; // Érték előjellel

                    this.logger.debug(`Parsed effect: stat=${statName}, modifier=${modifier}`);

                    // Alkalmazzuk a módosítást a megfelelő statisztikára
                    // Fontos a null/undefined értékek kezelése
                    switch (statName.toLowerCase()) {
                        case 'skill':
                            characterWithEffects.skill = (characterWithEffects.skill ?? 0) + modifier;
                            this.logger.log(`Applied effect: skill changed to ${characterWithEffects.skill}`);
                            break;
                        case 'health': // Max Health módosítására gondolunk itt? Vagy base health? Legyen max.
                            // TODO: Meg kell különböztetni a max HP-t és az aktuálisat.
                            // Jelenleg nincs max HP tárolva, így ezt nem tudjuk jól kezelni.
                            // Hagyjuk ki egyelőre a passzív HP módosítást.
                            this.logger.warn(`Passive health effect found, but max health handling not implemented.`);
                            break;
                        case 'luck':
                             characterWithEffects.luck = (characterWithEffects.luck ?? 0) + modifier;
                             this.logger.log(`Applied effect: luck changed to ${characterWithEffects.luck}`);
                            break;
                        case 'stamina': // Feltételezzük, hogy ez a max stamina
                             characterWithEffects.stamina = (characterWithEffects.stamina ?? 0) + modifier;
                             this.logger.log(`Applied effect: stamina changed to ${characterWithEffects.stamina}`);
                             break;
                        // TODO: Ide jöhetnek további statisztikák (pl. strength, defense stb.)
                        default:
                            this.logger.warn(`Unknown stat in passive effect: ${statName}`);
                            break;
                    }
                } else {
                    this.logger.warn(`Could not parse passive effect string: "${item.effect}"`);
                }
            } // if (isPassiveType && item.effect) vége
        } // for ciklus vége

        return characterWithEffects; // Visszaadjuk a módosított karaktert
    } // applyPassiveEffects vége

  /**
   * Ellenőrzi, hogy egy karakter rendelkezik-e egy adott tárgyból legalább egy darabbal.
   */
  async hasItem(characterId: number, itemId: number): Promise<boolean> {
    this.logger.debug(`Checking if character ${characterId} has item ${itemId}`);
    const itemEntry = await this.knex('character_inventory')
                              .where({
                                character_id: characterId,
                                item_id: itemId,
                              })
                              .andWhere('quantity', '>', 0)
                              .first(); // Elég csak megnézni, hogy létezik-e sor
    return !!itemEntry // Igaz, ha van találat, hamis, ha nincs
  }

  /**
   * Hozzáad egy tárgyat a karakter leltárához, vagy növeli a mennyiségét, ha már van.
   */
async addItemToInventory(characterId: number, itemId: number, quantityToAdd: number = 1): Promise<void> {
    if (quantityToAdd <= 0) {
        this.logger.warn(`Attempted to add non-positive quantity (${quantityToAdd}) of item ${itemId} for character ${characterId}`);
        return;
    }

    this.logger.log(`Adding item ${itemId} (quantity: ${quantityToAdd}) to inventory for character ${characterId}`);

    // Tranzakció használata az atomicitás érdekében (opcionális, de ajánlott)
    await this.knex.transaction(async (trx) => {
        const existingEntry = await trx('character_inventory')
                                      .where({ character_id: characterId, item_id: itemId })
                                      .first();

        if (existingEntry) {
          // Növeljük a mennyiséget
          this.logger.debug(`Item ${itemId} exists, incrementing quantity by ${quantityToAdd}.`);
          const affectedRows = await trx('character_inventory')
                .where({ character_id: characterId, item_id: itemId })
                .increment('quantity', quantityToAdd);
           if (affectedRows === 0) { // Előfordulhat race condition esetén? Biztonsági check.
               throw new Error('Failed to increment item quantity.');
           }
        } else {
          // Új bejegyzés beszúrása
          this.logger.debug(`Item ${itemId} not found, inserting new entry.`);
          await trx('character_inventory')
                .insert({
                  character_id: characterId,
                  item_id: itemId,
                  quantity: quantityToAdd,
                });
        }
    }); // Tranzakció vége

    this.logger.log(`Item ${itemId} successfully added/updated for character ${characterId}`)
  }

   /**
    * Eltávolít egy tárgyat a karakter leltárából, vagy csökkenti a mennyiségét.
    * Visszaadja, hogy sikeres volt-e a művelet (pl. volt-e elég tárgy).
    */
  async removeItemFromInventory(characterId: number, itemId: number, quantityToRemove: number = 1): Promise<boolean> {
        if (quantityToRemove <= 0) return true // 0 vagy negatív mennyiség eltávolítása mindig "sikeres"

        this.logger.log(`Removing item ${itemId} (quantity: ${quantityToRemove}) from inventory for character ${characterId}`)
        let success = false

        await this.knex.transaction(async (trx) => {
            const existingEntry = await trx('character_inventory')
              .where({ character_id: characterId, item_id: itemId })
              .forUpdate()
              .first()

            if (existingEntry && existingEntry.quantity >= quantityToRemove) {
                const newQuantity = existingEntry.quantity - quantityToRemove;
                if (newQuantity > 0) {
                    // Csak csökkentjük a mennyiséget
                    this.logger.debug(`Decreasing quantity of item ${itemId} to ${newQuantity}`)
                    await trx('character_inventory')
                          .where({ character_id: characterId, item_id: itemId })
                          .update({ quantity: newQuantity })
                } else {
                    // Töröljük a sort, ha a mennyiség 0 vagy kevesebb lesz
                    this.logger.debug(`Removing item ${itemId} completely (quantity reached zero).`);
                    await trx('character_inventory')
                          .where({ character_id: characterId, item_id: itemId })
                          .del()
                }
                success = true; // Sikeres volt a művelet
            } else {
                // Nincs ilyen tárgy, vagy nincs elég belőle
                this.logger.warn(`Failed to remove item ${itemId}: Not found or insufficient quantity for character ${characterId}.`)
                success = false // Sikertelen volt
            }
        }); // Tranzakció vége

        return success
   }
}