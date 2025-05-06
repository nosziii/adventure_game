// src/character.service.ts
import { Injectable, Inject, NotFoundException, Logger, InternalServerErrorException, BadRequestException } from '@nestjs/common';
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
    level: number
    xp: number
    xp_to_next_level: number
    current_node_id: number | null
    created_at: Date
    updated_at: Date
    equipped_weapon_id: number | null
    equipped_armor_id: number | null
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



 // --- Tárgy felszerelése - JAVÍTOTT ---
    async equipItem(characterId: number, itemId: number): Promise<Character> { // Visszatérési típus: Promise<Character>
        this.logger.log(`Attempting to equip item ${itemId} for character ${characterId}`);

        const hasItemInInventory = await this.hasItem(characterId, itemId);
        if (!hasItemInInventory) {
            throw new BadRequestException(`Character ${characterId} does not possess item ${itemId}.`);
        }

        const item = await this.knex('items').where({ id: itemId }).first();
        if (!item) { throw new InternalServerErrorException('Item data not found.'); }

        let equipSlotColumn: 'equipped_weapon_id' | 'equipped_armor_id' | null = null;
        let updateData: Partial<Character> = {}; // Objektum a frissítendő adatoknak

        if (item.type === 'weapon') {
            equipSlotColumn = 'equipped_weapon_id';
            updateData.equipped_weapon_id = itemId;
        } else if (item.type === 'armor') {
            equipSlotColumn = 'equipped_armor_id';
            updateData.equipped_armor_id = itemId;
        }

        if (!equipSlotColumn) {
            throw new BadRequestException(`Item ${itemId} (${item.name}) is not equippable.`);
        }

        try {
            this.logger.debug(`Equipping item ${itemId} into slot ${equipSlotColumn} for character ${characterId}`);
            // Használjuk az updateCharacter metódust a frissítéshez
            const updatedCharacter = await this.updateCharacter(characterId, updateData);
            this.logger.log(`Item ${itemId} equipped successfully for character ${characterId}`);
            // Alkalmazzuk az effekteket és adjuk vissza a végső karakter állapotot
            return await this.applyPassiveEffects(updatedCharacter); // <-- RETURN itt van!
        } catch (error) {
            this.logger.error(`Failed to equip item ${itemId} for character ${characterId}: ${error}`, error.stack);
            // A hiba továbbdobása vagy specifikusabb hibakezelés
             if (error instanceof NotFoundException || error instanceof InternalServerErrorException) {
                 throw error; // Dobjuk tovább a már ismert hibákat
             }
            throw new InternalServerErrorException('Failed to equip item due to an unexpected error.');
        }
    }

    // --- Tárgy levétele - JAVÍTOTT ---
    async unequipItem(characterId: number, itemType: 'weapon' | 'armor'): Promise<Character> { // Visszatérési típus: Promise<Character>
         this.logger.log(`Attempting to unequip item type ${itemType} for character ${characterId}`);
         let equipSlotColumn: 'equipped_weapon_id' | 'equipped_armor_id' | null = null;
         let updateData: Partial<Character> = {};

         if (itemType === 'weapon') {
            equipSlotColumn = 'equipped_weapon_id';
            updateData.equipped_weapon_id = null; // NULL-ra állítjuk
         } else if (itemType === 'armor') {
            equipSlotColumn = 'equipped_armor_id';
            updateData.equipped_armor_id = null; // NULL-ra állítjuk
         }

         if (!equipSlotColumn) {
            throw new BadRequestException(`Invalid item type "${itemType}" for unequipping.`);
         }

         try {
             this.logger.debug(`Unequipping slot ${equipSlotColumn} for character ${characterId}`);
             // Használjuk az updateCharacter metódust a frissítéshez (NULL-ra állításhoz)
             const updatedCharacter = await this.updateCharacter(characterId, updateData);
             this.logger.log(`Item type ${itemType} unequipped successfully for character ${characterId}`);
             // Alkalmazzuk az effekteket (most már a levett tárgy nélkül) és adjuk vissza
             return await this.applyPassiveEffects(updatedCharacter); // <-- RETURN itt van!
         } catch (error) {
              this.logger.error(`Failed to unequip item type ${itemType} for character ${characterId}: ${error}`, error.stack);
              if (error instanceof NotFoundException || error instanceof InternalServerErrorException) {
                  throw error;
              }
              throw new InternalServerErrorException('Failed to unequip item due to an unexpected error.');
         }
    }







  /**
   * Lekérdezi egy karakter leltárának egy elemét, az item_id alapján.
   * Ez a metódus nem csatlakozik az items táblához, csak a character_inventory táblát használja.
   * Használható például a karakter leltárának egy adott elemének lekérdezésére.
   */
  // TODO: Később ezt is bővíteni kellene

  // --- applyPassiveEffects : Már csak a felszerelt tárgyakat nézi ---
    private async applyPassiveEffects(character: Character): Promise<Character> {
        const characterWithEffects = { ...character };
        this.logger.debug(`Applying passive effects for character ${character.id}. WeaponID: ${character.equipped_weapon_id}, ArmorID: ${character.equipped_armor_id}`);

        const equippedItemIds = [character.equipped_weapon_id, character.equipped_armor_id]
                                 .filter((id): id is number => id !== null && id !== undefined); // Összegyűjtjük a nem null ID-kat

        if (equippedItemIds.length === 0) {
            this.logger.debug('No items equipped, no passive effects to apply.');
            return characterWithEffects; // Visszaadjuk az eredetit, ha nincs mit alkalmazni
        }

        // Lekérdezzük az összes felszerelt tárgy adatát egyszerre
        const equippedItems = await this.knex('items').whereIn('id', equippedItemIds);

        for (const item of equippedItems) {
             // Csak a passzívnak ítélt típusokat vesszük figyelembe (vagy azokat, amiknek van effektje)
             const isPassiveType = ['weapon', 'armor', 'ring', 'amulet'].includes(item.type?.toLowerCase() ?? '');

            if (isPassiveType && typeof item.effect === 'string' && item.effect.length > 0) {
                this.logger.debug(`Parsing passive effect "${item.effect}" from equipped item ${item.id} (${item.name})`);
                // Effektek értelmezése (ugyanaz a logika, mint korábban)
                const effects = item.effect.split(';'); // Ha több effekt van pontosvesszővel elválasztva
                for (const effectPart of effects) {
                    const effectRegex = /(\w+)\s*([+-])\s*(\d+)/;
                    const match = effectPart.trim().match(effectRegex);

                    if (match) {
                        const [, statName, operator, valueStr] = match;
                        const value = parseInt(valueStr, 10);
                        const modifier = operator === '+' ? value : -value;
                        this.logger.debug(`Parsed effect part: stat=${statName}, modifier=${modifier}`);

                        switch (statName.toLowerCase()) {
                            case 'skill':
                                characterWithEffects.skill = (characterWithEffects.skill ?? 0) + modifier;
                                this.logger.log(`Applied effect: skill changed to ${characterWithEffects.skill}`);
                                break;
                            case 'luck':
                                 characterWithEffects.luck = (characterWithEffects.luck ?? 0) + modifier;
                                 this.logger.log(`Applied effect: luck changed to ${characterWithEffects.luck}`);
                                break;
                            case 'stamina':
                                 characterWithEffects.stamina = (characterWithEffects.stamina ?? 0) + modifier;
                                 this.logger.log(`Applied effect: stamina changed to ${characterWithEffects.stamina}`);
                                 break;
                            // TODO: Ide jöhetnek más statok (pl. max_health, defense)
                            default: this.logger.warn(`Unknown stat in passive effect: ${statName}`); break;
                        }
                    } else { this.logger.warn(`Could not parse passive effect part: "${effectPart}"`); }
                } // for effectPart vége
            } // if (isPassiveType...) vége
        } // for item vége

        return characterWithEffects;
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
  // XP Hozzáadása és Szintlépés Kezelése ---
    async addXp(characterId: number, xpToAdd: number): Promise<{ leveledUp: boolean; messages: string[] }> {
        if (xpToAdd <= 0) {
            return { leveledUp: false, messages: [] }; // Ne csinálj semmit, ha nincs XP
        }
        this.logger.log(`Attempting to add ${xpToAdd} XP to character ${characterId}`);

        const character = await this.findById(characterId); // Lekérdezzük a karaktert (effektek nélkül?) Elég lehet a DB adat. Legyen findById.
        if (!character) {
             this.logger.error(`Cannot add XP, character ${characterId} not found.`);
             throw new NotFoundException('Character not found to add XP.');
        }

        let currentXp = character.xp + xpToAdd;
        let currentLevel = character.level;
        let currentXpToNext = character.xp_to_next_level;
        let currentSkill = character.skill ?? 0; // Null kezelés
        let currentLuck = character.luck ?? 0;
        let currentStamina = character.stamina ?? 100; // Alap max HP?
        let currentHealth = character.health; // Jelenlegi HP

        let leveledUp = false;
        const levelUpMessages: string[] = [];

        // Szintlépés ciklus (ha több szintet is lépne egyszerre)
        while (currentXp >= currentXpToNext) {
            leveledUp = true;
            currentLevel++; // Szint növelése
            const xpOver = currentXp - currentXpToNext; // XP a szintlépés felett
            currentXp = xpOver; // Az új XP a maradék lesz

            // Új xp_to_next_level számítása (példa: 100 * 1.5^(szint-1))
            const newXpToNext = Math.floor(100 * Math.pow(1.5, currentLevel - 1));
            currentXpToNext = newXpToNext;

            // Stat növelések (példa)
            const skillIncrease = 1;
            const luckIncrease = 2;
            const staminaIncrease = 10; // Max HP növelés

            currentSkill += skillIncrease;
            currentLuck += luckIncrease;
            currentStamina += staminaIncrease;
            // Szintlépéskor gyógyuljon max HP-ra?
            currentHealth = currentStamina;

            const levelUpMsg = `SZINTLÉPÉS! Elérted a ${currentLevel}. szintet! Skill+${skillIncrease}, Luck+${luckIncrease}, Stamina+${staminaIncrease}. Életerő visszatöltve!`;
            this.logger.log(`Character ${characterId} leveled up to ${currentLevel}.`);
            levelUpMessages.push(levelUpMsg);
        } // while vége

        // Adatbázis frissítése az új értékekkel
        try {
             const updates: Partial<Character> = {
                 level: currentLevel,
                 xp: currentXp,
                 xp_to_next_level: currentXpToNext,
                 skill: currentSkill,
                 luck: currentLuck,
                 stamina: currentStamina, // Frissítjük a max HP-t (stamina)
                 health: currentHealth // Frissítjük az aktuális HP-t is (gyógyulás)
             };
             await this.updateCharacter(characterId, updates); // Használjuk a meglévő update-et
             this.logger.log(`Character ${characterId} XP/Level/Stats updated.`);
             return { leveledUp, messages: levelUpMessages };
        } catch(error) {
             this.logger.error(`Failed to update character ${characterId} after XP gain/level up: ${error}`, error.stack);
             throw new InternalServerErrorException('Failed to save character progression.');
        }

    } // addXp vége
}