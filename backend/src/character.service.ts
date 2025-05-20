// src/character.service.ts
import {
  Injectable,
  Inject,
  NotFoundException,
  Logger,
  InternalServerErrorException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Knex } from 'knex';
import { KNEX_CONNECTION } from './database/database.module'; // Ellenőrizd az útvonalat!
import { InventoryItem } from './types/character.interfaces';
import { InventoryItemDto } from './game/dto/inventory-item.dto';
import { CharacterStoryProgressRecord } from './game/interfaces/character-story-progres-record.interface';
import { StoryRecord } from './game/interfaces/story-record.interface';

export interface Character {
  id: number;
  user_id: number;
  name: string | null;
  health: number;
  skill: number;
  luck: number | null;
  stamina: number | null;
  level: number;
  xp: number;
  xp_to_next_level: number;
  current_node_id: number | null;
  created_at: Date;
  updated_at: Date;
  defense: number | null;
  equipped_weapon_id: number | null;
  equipped_armor_id: number | null;
}

const STARTING_NODE_ID = 1;

const DEFAULT_HEALTH = 100;
const DEFAULT_SKILL = 10;
const DEFAULT_LUCK = 5;
const DEFAULT_STAMINA = 100;
const DEFAULT_DEFENSE = 0;
const DEFAULT_LEVEL = 1;
const DEFAULT_XP = 0;
const DEFAULT_XP_TO_NEXT_LEVEL = 100;

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
    const defaultLevel = 1;
    const defaultXp = 0;
    const defaultXpToNextLevel = 100;

    try {
      const [newCharacter] = await this.knex('characters')
        .insert({
          user_id: userId,
          current_node_id: STARTING_NODE_ID,
          health: defaultHealth,
          skill: defaultSkill,
          luck: defaultLuck,
          stamina: defaultStamina,
          level: defaultLevel,
          xp: defaultXp,
          xp_to_next_level: defaultXpToNextLevel,
          name: 'Kalandor', // Alap név
        })
        .returning('*'); // Visszakérjük az új karakter minden adatát

      this.logger.log(
        `New character created with ID: ${newCharacter.id} for user ID: ${userId}`,
      );

      await this.knex('player_progress').insert({
        character_id: newCharacter.id,
        node_id: STARTING_NODE_ID, // Ahol a karakter kezd
        choice_id_taken: null, // Nincs választás, ami ide vezetett
        // visited_at automatikusan beállítódik a DEFAULT CURRENT_TIMESTAMP miatt
      });

      return newCharacter;
    } catch (error) {
      this.logger.error(
        `Failed to create character for user ${userId}: ${error}`,
        error.stack,
      );
      throw new InternalServerErrorException('Could not create character.');
    }
  }

  // Karakter frissítése (pl. node ID vagy statok)
  // A 'Partial<Character>' lehetővé teszi, hogy csak a módosítandó mezőket adjuk át
  async updateCharacter(
    characterId: number,
    updates: Partial<
      Omit<Character, 'id' | 'user_id' | 'created_at' | 'updated_at'>
    >,
  ): Promise<Character> {
    this.logger.debug(
      `Updating character ID: ${characterId} with data: ${JSON.stringify(updates)}`,
    );
    const [updatedCharacter] = await this.knex('characters')
      .where({ id: characterId })
      .update(updates)
      .returning('*');

    if (!updatedCharacter) {
      this.logger.error(
        `Failed to update character ${characterId}, character not found after update attempt.`,
      );
      throw new NotFoundException(
        `Character with ID ${characterId} not found for update.`,
      );
    }
    this.logger.debug(`Character ${characterId} updated successfully.`);
    return updatedCharacter;
  }

  async findOrCreateByUserId(userId: number): Promise<Character> {
    let character = await this.findByUserId(userId); // Ez már az effektekkel ellátottat adja vissza, ha létezik
    if (!character) {
      this.logger.log(
        `Character not found for user ${userId} in findOrCreate, creating new one.`,
      );
      const baseCharacter = await this.createCharacter(userId);
      character = await this.applyPassiveEffects(baseCharacter);
    }
    return character;
  }

  /**
   * Lekérdezi egy karakter teljes leltárát, joinolva az item adatokkal.
   */
  async getInventory(characterId: number): Promise<InventoryItemDto[]> {
    this.logger.debug(
      `Workspaceing inventory for character ID: ${characterId}`,
    );
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
          'i.usable',
        )
        .where('ci.character_id', characterId);
      return inventory;
    } catch (error) {
      this.logger.error(
        `Failed to fetch inventory for character ${characterId}: ${error}`,
        error.stack,
      );
      throw new InternalServerErrorException('Could not retrieve inventory.');
    }
  }

  // --- Tárgy felszerelése - JAVÍTOTT ---
  async equipItem(characterId: number, itemId: number): Promise<Character> {
    // Visszatérési típus: Promise<Character>
    this.logger.log(
      `Attempting to equip item ${itemId} for character ${characterId}`,
    );

    const hasItemInInventory = await this.hasItem(characterId, itemId);
    if (!hasItemInInventory) {
      throw new BadRequestException(
        `Character ${characterId} does not possess item ${itemId}.`,
      );
    }

    const item = await this.knex('items').where({ id: itemId }).first();
    if (!item) {
      throw new InternalServerErrorException('Item data not found.');
    }

    let equipSlotColumn: 'equipped_weapon_id' | 'equipped_armor_id' | null =
      null;
    let updateData: Partial<Character> = {}; // Objektum a frissítendő adatoknak

    if (item.type === 'weapon') {
      equipSlotColumn = 'equipped_weapon_id';
      updateData.equipped_weapon_id = itemId;
    } else if (item.type === 'armor') {
      equipSlotColumn = 'equipped_armor_id';
      updateData.equipped_armor_id = itemId;
    }

    if (!equipSlotColumn) {
      throw new BadRequestException(
        `Item ${itemId} (${item.name}) is not equippable.`,
      );
    }

    try {
      this.logger.debug(
        `Equipping item ${itemId} into slot ${equipSlotColumn} for character ${characterId}`,
      );
      // Használjuk az updateCharacter metódust a frissítéshez
      const updatedCharacter = await this.updateCharacter(
        characterId,
        updateData,
      );
      this.logger.log(
        `Item ${itemId} equipped successfully for character ${characterId}`,
      );
      // Alkalmazzuk az effekteket és adjuk vissza a végső karakter állapotot
      return await this.applyPassiveEffects(updatedCharacter); // <-- RETURN itt van!
    } catch (error) {
      this.logger.error(
        `Failed to equip item ${itemId} for character ${characterId}: ${error}`,
        error.stack,
      );
      // A hiba továbbdobása vagy specifikusabb hibakezelés
      if (
        error instanceof NotFoundException ||
        error instanceof InternalServerErrorException
      ) {
        throw error; // Dobjuk tovább a már ismert hibákat
      }
      throw new InternalServerErrorException(
        'Failed to equip item due to an unexpected error.',
      );
    }
  }

  // --- Tárgy levétele - JAVÍTOTT ---
  async unequipItem(
    characterId: number,
    itemType: 'weapon' | 'armor',
  ): Promise<Character> {
    // Visszatérési típus: Promise<Character>
    this.logger.log(
      `Attempting to unequip item type ${itemType} for character ${characterId}`,
    );
    let equipSlotColumn: 'equipped_weapon_id' | 'equipped_armor_id' | null =
      null;
    let updateData: Partial<Character> = {};

    if (itemType === 'weapon') {
      equipSlotColumn = 'equipped_weapon_id';
      updateData.equipped_weapon_id = null; // NULL-ra állítjuk
    } else if (itemType === 'armor') {
      equipSlotColumn = 'equipped_armor_id';
      updateData.equipped_armor_id = null; // NULL-ra állítjuk
    }

    if (!equipSlotColumn) {
      throw new BadRequestException(
        `Invalid item type "${itemType}" for unequipping.`,
      );
    }

    try {
      this.logger.debug(
        `Unequipping slot ${equipSlotColumn} for character ${characterId}`,
      );
      // Használjuk az updateCharacter metódust a frissítéshez (NULL-ra állításhoz)
      const updatedCharacter = await this.updateCharacter(
        characterId,
        updateData,
      );
      this.logger.log(
        `Item type ${itemType} unequipped successfully for character ${characterId}`,
      );
      // Alkalmazzuk az effekteket (most már a levett tárgy nélkül) és adjuk vissza
      return await this.applyPassiveEffects(updatedCharacter); // <-- RETURN itt van!
    } catch (error) {
      this.logger.error(
        `Failed to unequip item type ${itemType} for character ${characterId}: ${error}`,
        error.stack,
      );
      if (
        error instanceof NotFoundException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to unequip item due to an unexpected error.',
      );
    }
  }

  /**
   * Lekérdezi egy karakter leltárának egy elemét, az item_id alapján.
   * Ez a metódus nem csatlakozik az items táblához, csak a character_inventory táblát használja.
   * Használható például a karakter leltárának egy adott elemének lekérdezésére.
   */
  // TODO: Később ezt is bővíteni kellene

  // --- applyPassiveEffects : Már csak a felszerelt tárgyakat nézi ---
  public async applyPassiveEffects(character: Character): Promise<Character> {
    const characterWithEffects = { ...character }; // Másolat
    // Alapértelmezett defense érték beállítása, ha null (a DB defaultja 0 kellene legyen)
    characterWithEffects.defense = characterWithEffects.defense ?? 0;
    // Alapértelmezett skill, luck, stamina is, ha lehetnek null-ok és számítunk velük
    characterWithEffects.skill = characterWithEffects.skill ?? 0;
    characterWithEffects.luck = characterWithEffects.luck ?? 0;
    characterWithEffects.stamina = characterWithEffects.stamina ?? 100;

    this.logger.debug(
      `Applying passive effects for char ${character.id}. Base Skill: ${character.skill}, Base Defense: ${character.defense}`,
    );

    const equippedItemIds = [
      character.equipped_weapon_id,
      character.equipped_armor_id,
    ].filter((id): id is number => id !== null && id !== undefined);

    if (equippedItemIds.length > 0) {
      const equippedItems = await this.knex('items').whereIn(
        'id',
        equippedItemIds,
      );
      this.logger.debug(
        `Found ${equippedItems.length} equipped items to process effects.`,
      );

      for (const item of equippedItems) {
        const isPassiveType = ['weapon', 'armor', 'ring', 'amulet'].includes(
          item.type?.toLowerCase() ?? '',
        );
        if (
          isPassiveType &&
          typeof item.effect === 'string' &&
          item.effect.length > 0
        ) {
          this.logger.debug(
            `Parsing passive effect "${item.effect}" from equipped item ID: ${item.id} (Name: ${item.name})`,
          );
          const effects = item.effect.split(';');
          for (const effectPart of effects) {
            const effectRegex = /(\w+)\s*([+-])\s*(\d+)/;
            const match = effectPart.trim().match(effectRegex);
            if (match) {
              const [, statName, operator, valueStr] = match;
              const value = parseInt(valueStr, 10);
              const modifier = operator === '+' ? value : -value;
              this.logger.debug(
                `Parsed effect part: stat=${statName}, modifier=${modifier}`,
              );

              switch (statName.toLowerCase()) {
                case 'skill':
                  characterWithEffects.skill =
                    (characterWithEffects.skill ?? 0) + modifier;
                  break;
                case 'luck':
                  characterWithEffects.luck =
                    (characterWithEffects.luck ?? 0) + modifier;
                  break;
                case 'stamina': // Ez a max HP-t (állóképességet) növeli
                  characterWithEffects.stamina =
                    (characterWithEffects.stamina ?? 0) + modifier;
                  break;
                case 'defense': // <-- ÚJ DEFENSE KEZELÉSE
                  characterWithEffects.defense =
                    (characterWithEffects.defense ?? 0) + modifier;
                  break;
                default:
                  this.logger.warn(
                    `Unknown stat in passive effect: ${statName}`,
                  );
                  break;
              }
            } else {
              this.logger.warn(
                `Could not parse passive effect part: "${effectPart}"`,
              );
            }
          } // for effectPart
        } // if isPassiveType
      } // for item
      this.logger.log(
        `Effects applied. Final stats: Skill=${characterWithEffects.skill}, Def=${characterWithEffects.defense}, Luck=${characterWithEffects.luck}, Stamina=${characterWithEffects.stamina}`,
      );
    } else {
      this.logger.debug('No items equipped, no passive effects to apply.');
    }
    return characterWithEffects;
  }

  /**
   * Ellenőrzi, hogy egy karakter rendelkezik-e egy adott tárgyból legalább egy darabbal.
   */
  async hasItem(characterId: number, itemId: number): Promise<boolean> {
    this.logger.debug(
      `Checking if character ${characterId} has item ${itemId}`,
    );
    const itemEntry = await this.knex('character_inventory')
      .where({
        character_id: characterId,
        item_id: itemId,
      })
      .andWhere('quantity', '>', 0)
      .first(); // Elég csak megnézni, hogy létezik-e sor
    return !!itemEntry; // Igaz, ha van találat, hamis, ha nincs
  }

  /**
   * Hozzáad egy tárgyat a karakter leltárához, vagy növeli a mennyiségét, ha már van.
   */
  async addItemToInventory(
    characterId: number,
    itemId: number,
    quantityToAdd: number = 1,
  ): Promise<void> {
    if (quantityToAdd <= 0) {
      this.logger.warn(
        `Attempted to add non-positive quantity (${quantityToAdd}) of item ${itemId} for character ${characterId}`,
      );
      return;
    }

    this.logger.log(
      `Adding item ${itemId} (quantity: ${quantityToAdd}) to inventory for character ${characterId}`,
    );

    // Tranzakció használata az atomicitás érdekében (opcionális, de ajánlott)
    await this.knex.transaction(async (trx) => {
      const existingEntry = await trx('character_inventory')
        .where({ character_id: characterId, item_id: itemId })
        .first();

      if (existingEntry) {
        // Növeljük a mennyiséget
        this.logger.debug(
          `Item ${itemId} exists, incrementing quantity by ${quantityToAdd}.`,
        );
        const affectedRows = await trx('character_inventory')
          .where({ character_id: characterId, item_id: itemId })
          .increment('quantity', quantityToAdd);
        if (affectedRows === 0) {
          // Előfordulhat race condition esetén? Biztonsági check.
          throw new Error('Failed to increment item quantity.');
        }
      } else {
        // Új bejegyzés beszúrása
        this.logger.debug(`Item ${itemId} not found, inserting new entry.`);
        await trx('character_inventory').insert({
          character_id: characterId,
          item_id: itemId,
          quantity: quantityToAdd,
        });
      }
    }); // Tranzakció vége

    this.logger.log(
      `Item ${itemId} successfully added/updated for character ${characterId}`,
    );
  }

  /**
   * Eltávolít egy tárgyat a karakter leltárából, vagy csökkenti a mennyiségét.
   * Visszaadja, hogy sikeres volt-e a művelet (pl. volt-e elég tárgy).
   */
  async removeItemFromInventory(
    characterId: number,
    itemId: number,
    quantityToRemove: number = 1,
  ): Promise<boolean> {
    if (quantityToRemove <= 0) return true; // 0 vagy negatív mennyiség eltávolítása mindig "sikeres"

    this.logger.log(
      `Removing item ${itemId} (quantity: ${quantityToRemove}) from inventory for character ${characterId}`,
    );
    let success = false;

    await this.knex.transaction(async (trx) => {
      const existingEntry = await trx('character_inventory')
        .where({ character_id: characterId, item_id: itemId })
        .forUpdate()
        .first();

      if (existingEntry && existingEntry.quantity >= quantityToRemove) {
        const newQuantity = existingEntry.quantity - quantityToRemove;
        if (newQuantity > 0) {
          // Csak csökkentjük a mennyiséget
          this.logger.debug(
            `Decreasing quantity of item ${itemId} to ${newQuantity}`,
          );
          await trx('character_inventory')
            .where({ character_id: characterId, item_id: itemId })
            .update({ quantity: newQuantity });
        } else {
          // Töröljük a sort, ha a mennyiség 0 vagy kevesebb lesz
          this.logger.debug(
            `Removing item ${itemId} completely (quantity reached zero).`,
          );
          await trx('character_inventory')
            .where({ character_id: characterId, item_id: itemId })
            .del();
        }
        success = true; // Sikeres volt a művelet
      } else {
        // Nincs ilyen tárgy, vagy nincs elég belőle
        this.logger.warn(
          `Failed to remove item ${itemId}: Not found or insufficient quantity for character ${characterId}.`,
        );
        success = false; // Sikertelen volt
      }
    }); // Tranzakció vége

    return success;
  }
  // XP Hozzáadása és Szintlépés Kezelése ---
  async addXp(
    characterId: number,
    xpToAdd: number,
  ): Promise<{ leveledUp: boolean; messages: string[] }> {
    if (xpToAdd <= 0) {
      return { leveledUp: false, messages: [] }; // Ne csinálj semmit, ha nincs XP
    }
    this.logger.log(
      `Attempting to add ${xpToAdd} XP to character ${characterId}`,
    );

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
      this.logger.log(
        `Character ${characterId} leveled up to ${currentLevel}.`,
      );
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
        health: currentHealth, // Frissítjük az aktuális HP-t is (gyógyulás)
      };
      await this.updateCharacter(characterId, updates); // Használjuk a meglévő update-et
      this.logger.log(`Character ${characterId} XP/Level/Stats updated.`);
      return { leveledUp, messages: levelUpMessages };
    } catch (error) {
      this.logger.error(
        `Failed to update character ${characterId} after XP gain/level up: ${error}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Failed to save character progression.',
      );
    }
  } // addXp vége

  async getActiveStoryProgress(
    characterId: number,
  ): Promise<CharacterStoryProgressRecord | null> {
    this.logger.debug(
      `Workspaceing active story progress for character ID: ${characterId}`,
    );
    const progress = await this.knex<CharacterStoryProgressRecord>(
      'character_story_progress',
    )
      .where({ character_id: characterId, is_active: true })
      .first();
    return progress || null;
  }

  async startOrContinueStory(
    characterId: number,
    storyId: number,
  ): Promise<CharacterStoryProgressRecord> {
    this.logger.log(
      `Character ${characterId} starting/continuing story ID: ${storyId}`,
    );

    // 1. Sztori adatainak lekérése
    const story = await this.knex<StoryRecord>('stories')
      .where({ id: storyId })
      .first();
    if (!story) {
      this.logger.warn(`Story with ID ${storyId} not found.`);
      throw new NotFoundException(`Story with ID ${storyId} not found.`);
    }
    if (!story.is_published) {
      // TODO: Adminoknak engedélyezni a nem publikált sztorik tesztelését?
      this.logger.warn(`Story with ID ${storyId} is not published.`);
      throw new ForbiddenException(
        `Story with ID ${storyId} is not available.`,
      );
    }

    const startingNodeId = story.starting_node_id;

    // Tranzakció indítása
    const progressRecord = await this.knex.transaction(async (trx) => {
      this.logger.debug(
        `Clearing any existing active combat for character ${characterId} before starting/continuing story ${storyId}`,
      );
      await trx('active_combats').where({ character_id: characterId }).del();
      // 2. Minden más aktív sztori progresszió inaktiválása ennél a karakternél
      await trx('character_story_progress')
        .where({ character_id: characterId, is_active: true })
        .andWhereNot({ story_id: storyId }) // Ne inaktiváljuk, ha már ez volt az aktív
        .update({ is_active: false, updated_at: new Date() });

      // 3. Meglévő progresszió keresése ehhez a sztorihoz
      let currentProgress: CharacterStoryProgressRecord | undefined =
        await trx<CharacterStoryProgressRecord>('character_story_progress')
          .where({ character_id: characterId, story_id: storyId })
          .first();

      if (currentProgress) {
        // Ha van, aktiváljuk és frissítjük a last_played_at-et
        this.logger.log(
          `Continuing existing progress for story ${storyId} for character ${characterId}`,
        );
        const updatedRows = await trx('character_story_progress')
          .where({ id: currentProgress.id }) // Itt a currentProgress biztosan nem undefined
          .update({
            is_active: true,
            last_played_at: new Date(),
            updated_at: new Date(),
          })
          .returning('*');

        if (!updatedRows || updatedRows.length === 0 || !updatedRows[0]) {
          // Szigorúbb ellenőrzés
          this.logger.error(
            `Failed to update or retrieve character_story_progress for id ${currentProgress.id}.`,
          );
          throw new InternalServerErrorException(
            'Failed to update story progress.',
          );
        }
        currentProgress = updatedRows[0]; // Most már biztosan CharacterStoryProgressRecord
      } else {
        // Ha nincs, létrehozunk egy újat
        this.logger.log(
          `Creating new progress for story ${storyId} for character ${characterId}`,
        );
        const insertedRows = await trx('character_story_progress')
          .insert({
            character_id: characterId,
            story_id: storyId,
            current_node_id: startingNodeId, // startingNodeId a függvény elejéről
            health: DEFAULT_HEALTH,
            skill: DEFAULT_SKILL,
            luck: DEFAULT_LUCK,
            stamina: DEFAULT_STAMINA,
            defense: DEFAULT_DEFENSE,
            level: DEFAULT_LEVEL,
            xp: DEFAULT_XP,
            xp_to_next_level: DEFAULT_XP_TO_NEXT_LEVEL,
            is_active: true,
            // equipped_weapon_id és equipped_armor_id alapból NULL
          })
          .returning('*');

        if (!insertedRows || insertedRows.length === 0 || !insertedRows[0]) {
          // Szigorúbb ellenőrzés
          this.logger.error(
            `Failed to insert or retrieve new character_story_progress for char ${characterId}, story ${storyId}.`,
          );
          throw new InternalServerErrorException(
            'Failed to create new story progress.',
          );
        }
        currentProgress = insertedRows[0]; // Most már biztosan CharacterStoryProgressRecord

        // Új kezdőpozíció rögzítése a player_progress táblában az új progress ID-val
        // Itt a 'currentProgress' már biztosan nem undefined az előző ellenőrzés és hibadobás miatt
        await trx('player_progress').insert({
          character_story_progress_id:
            currentProgress?.id ??
            (() => {
              throw new InternalServerErrorException(
                'currentProgress is undefined.',
              );
            })(),
          node_id: startingNodeId,
          choice_id_taken: null,
        });
        this.logger.debug(
          `Initial player_progress logged for new story progress ${currentProgress.id}`,
        );
      }
      // Ebben a pontban a 'currentProgress' már biztosan CharacterStoryProgressRecord típusú,
      // mert minden olyan ág, ahol 'undefined' maradhatna, már hibát dobott és kilépett a tranzakcióból.
      this.logger.debug(
        '[startOrContinueStory] Progress before returning from transaction:',
        JSON.stringify(currentProgress, null, 2),
      );
      return currentProgress; // A tranzakció ezt adja vissza
    }); // Tranzakció vége

    // A 'progressRecord' itt már a tranzakció által visszaadott (és nem undefined) érték lesz,
    // mivel a tranzakción belüli logika vagy sikeresen visszaad egy rekordot, vagy hibát dob.
    // A startOrContinueStory metódus `Promise<CharacterStoryProgressRecord>` visszatérési típusa így teljesül.

    if (!progressRecord) {
      throw new InternalServerErrorException(
        'Failed to retrieve story progress.',
      );
    }
    this.logger.debug(
      '[startOrContinueStory] Progress record after transaction:',
      JSON.stringify(progressRecord, null, 2),
    );
    return progressRecord;
  }

  // TODO: async resetStoryProgress(characterId: number, storyId: number): Promise<void>
  // Ez törölné a character_story_progress, character_story_inventory, player_progress bejegyzéseket
  // az adott characterId + storyId pároshoz, és újra létrehozná az alap character_story_progress-t.
}
