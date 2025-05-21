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
import { ItemRecord } from './game/interfaces/item-record.interface';

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
  async getStoryInventory(progressId: number): Promise<InventoryItemDto[]> {
    this.logger.debug(
      `Workspaceing inventory for story progress ID: ${progressId}`,
    );
    // JOIN az items táblával a tárgy nevének, leírásának stb. lekéréséhez
    return this.knex('character_story_inventory as csi')
      .join('items', 'items.id', 'csi.item_id')
      .where('csi.character_story_progress_id', progressId)
      .andWhere('csi.quantity', '>', 0)
      .select(
        'items.id as itemId',
        'items.name',
        'items.description',
        'items.type',
        'items.effect',
        'items.usable',
        'csi.quantity',
      );
  }

  async hasStoryItem(
    progressId: number,
    itemId: number,
    quantity: number = 1,
  ): Promise<boolean> {
    this.logger.debug(
      `Checking if story progress ID ${progressId} has item ${itemId} (quantity: ${quantity})`,
    );
    const itemEntry = await this.knex('character_story_inventory')
      .where({
        character_story_progress_id: progressId,
        item_id: itemId,
      })
      .andWhere('quantity', '>=', quantity)
      .first();
    return !!itemEntry; // Igaz, ha van ilyen bejegyzés elegendő mennyiséggel
  }

  async addStoryItem(
    progressId: number,
    itemId: number,
    quantity: number = 1,
  ): Promise<void> {
    if (quantity <= 0) return;
    this.logger.log(
      `Adding item ${itemId} (quantity ${quantity}) to story progress ID: ${progressId}`,
    );

    const existingEntry = await this.knex('character_story_inventory')
      .where({ character_story_progress_id: progressId, item_id: itemId })
      .first();

    if (existingEntry) {
      await this.knex('character_story_inventory')
        .where({ id: existingEntry.id })
        .increment('quantity', quantity)
        .update({ updated_at: new Date() });
      this.logger.debug(
        `Incremented quantity for item ${itemId} for progress ${progressId}`,
      );
    } else {
      await this.knex('character_story_inventory').insert({
        character_story_progress_id: progressId,
        item_id: itemId,
        quantity: quantity,
      });
      this.logger.debug(
        `Inserted new item ${itemId} for progress ${progressId}`,
      );
    }
  }

  async removeStoryItem(
    progressId: number,
    itemId: number,
    quantity: number = 1,
  ): Promise<boolean> {
    if (quantity <= 0) return true; // Nincs mit eltávolítani
    this.logger.log(
      `Removing item ${itemId} (quantity ${quantity}) from story progress ID: ${progressId}`,
    );

    const existingEntry = await this.knex('character_story_inventory')
      .where({ character_story_progress_id: progressId, item_id: itemId })
      .first();

    if (existingEntry && existingEntry.quantity >= quantity) {
      const newQuantity = existingEntry.quantity - quantity;
      if (newQuantity > 0) {
        await this.knex('character_story_inventory')
          .where({ id: existingEntry.id })
          .update({ quantity: newQuantity, updated_at: new Date() });
        this.logger.debug(
          `Decremented quantity for item ${itemId} to ${newQuantity} for progress ${progressId}`,
        );
      } else {
        await this.knex('character_story_inventory')
          .where({ id: existingEntry.id })
          .del();
        this.logger.debug(
          `Removed item ${itemId} (quantity reached 0) for progress ${progressId}`,
        );
      }
      return true; // Sikeres eltávolítás/csökkentés
    } else {
      this.logger.warn(
        `Failed to remove item ${itemId}: not enough quantity or item not found for progress ${progressId}.`,
      );
      return false; // Nem sikerült az eltávolítás
    }
  }

  // --- Sztori Progresszió Frissítése ---
  async updateStoryProgress(
    progressId: number,
    updates: Partial<
      Omit<
        CharacterStoryProgressRecord,
        'id' | 'character_id' | 'story_id' | 'created_at' | 'updated_at'
      >
    >,
  ): Promise<CharacterStoryProgressRecord> {
    this.logger.debug(
      `Updating story progress ID: ${progressId} with data: ${JSON.stringify(updates)}`,
    );
    const finalUpdates = { ...updates, updated_at: new Date() };

    const [updatedRecord] = await this.knex('character_story_progress')
      .where({ id: progressId })
      .update(finalUpdates)
      .returning('*');

    if (!updatedRecord) {
      this.logger.error(
        `Failed to update story progress ${progressId}, record not found.`,
      );
      throw new NotFoundException(
        `Story progress with ID ${progressId} not found for update.`,
      );
    }
    this.logger.debug(`Story progress ${progressId} updated successfully.`);
    return updatedRecord;
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

  // --- Tárgy felszerelése - JAVÍTOTT ---
  async equipItem(
    characterId: number,
    itemId: number,
  ): Promise<CharacterStoryProgressRecord> {
    this.logger.log(
      `Character ${characterId} attempting to equip item ${itemId} for their active story.`,
    );
    const activeStoryProgress = await this.getActiveStoryProgress(characterId);
    if (!activeStoryProgress) {
      throw new NotFoundException(
        'No active story progress found for character to equip item.',
      );
    }

    const progressId = activeStoryProgress.id;

    // 1. Ellenőrizzük, megvan-e a tárgy a sztori-specifikus leltárban
    const hasItemInStoryInventory = await this.hasStoryItem(progressId, itemId);
    if (!hasItemInStoryInventory) {
      this.logger.warn(
        `Item ${itemId} not found in story inventory for progress ${progressId}.`,
      );
      throw new BadRequestException(
        `You do not possess this item in the current story's inventory.`,
      );
    }

    // 2. Kérjük le a tárgy típusát
    const item = await this.knex<ItemRecord>('items')
      .where({ id: itemId })
      .first();
    if (!item) {
      // Ennek nem szabadna előfordulnia, ha a hasStoryItem igazat adott
      throw new InternalServerErrorException(
        `Item data for ID ${itemId} not found.`,
      );
    }

    let equipSlotColumn: keyof CharacterStoryProgressRecord | null = null;
    let updates: Partial<CharacterStoryProgressRecord> = {};

    if (item.type === 'weapon') {
      equipSlotColumn = 'equipped_weapon_id';
      updates.equipped_weapon_id = itemId;
    } else if (item.type === 'armor') {
      equipSlotColumn = 'equipped_armor_id';
      updates.equipped_armor_id = itemId;
    } else {
      this.logger.warn(
        `Item ${itemId} (${item.name}) of type ${item.type} is not equippable.`,
      );
      throw new BadRequestException(`Item ${item.name} is not equippable.`);
    }

    // 3. Frissítjük a character_story_progress rekordot
    this.logger.debug(
      `Equipping item ${itemId} into slot ${equipSlotColumn} for story progress ${progressId}`,
    );
    return this.updateStoryProgress(progressId, updates);
  }

  // --- Tárgy levétele - JAVÍTOTT ---
  async unequipItem(
    characterId: number,
    itemType: 'weapon' | 'armor',
  ): Promise<CharacterStoryProgressRecord> {
    this.logger.log(
      `Character ${characterId} attempting to unequip item type ${itemType} for their active story.`,
    );
    const activeStoryProgress = await this.getActiveStoryProgress(characterId);
    if (!activeStoryProgress) {
      throw new NotFoundException(
        'No active story progress found for character to unequip item.',
      );
    }
    const progressId = activeStoryProgress.id;

    let equipSlotColumn: keyof CharacterStoryProgressRecord | null = null;
    let updates: Partial<CharacterStoryProgressRecord> = {};

    if (itemType === 'weapon') {
      equipSlotColumn = 'equipped_weapon_id';
      updates.equipped_weapon_id = null;
    } else if (itemType === 'armor') {
      equipSlotColumn = 'equipped_armor_id';
      updates.equipped_armor_id = null;
    } else {
      // Ezt a DTO validációnak kellene elkapnia, de itt is jó egy ellenőrzés
      throw new BadRequestException(
        `Invalid item type "${itemType}" for unequipping.`,
      );
    }

    this.logger.debug(
      `Unequipping slot ${equipSlotColumn} for story progress ${progressId}`,
    );
    return this.updateStoryProgress(progressId, updates);
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

  async resetStoryProgress(
    characterId: number,
    storyId: number,
  ): Promise<void> {
    this.logger.log(
      `Character ${characterId} attempting to reset progress for story ID: ${storyId}`,
    );

    await this.knex.transaction(async (trx) => {
      const progress = await trx<CharacterStoryProgressRecord>(
        'character_story_progress',
      )
        .where({ character_id: characterId, story_id: storyId })
        .first('id'); // Csak az ID-ra van szükségünk a hivatkozott táblákhoz

      if (progress && progress.id) {
        const progressId = progress.id;
        this.logger.debug(`Found story progress ID: ${progressId} to reset.`);

        // 1. Kapcsolódó player_progress bejegyzések törlése
        await trx('player_progress')
          .where({ character_story_progress_id: progressId })
          .del();
        this.logger.debug(
          `Deleted player_progress entries for progress ID: ${progressId}`,
        );

        // 2. Kapcsolódó character_story_inventory bejegyzések törlése
        await trx('character_story_inventory')
          .where({ character_story_progress_id: progressId })
          .del();
        this.logger.debug(
          `Deleted character_story_inventory entries for progress ID: ${progressId}`,
        );

        // 3. Maga a character_story_progress bejegyzés törlése
        await trx('character_story_progress').where({ id: progressId }).del();
        this.logger.log(
          `Story progress ID: ${progressId} has been reset for character ${characterId}.`,
        );

        // Opcionális: Ha ez volt az aktív sztori, és nincs más aktív,
        // akkor itt nem állítunk be újat, a játékos a dashboardra kerül.
      } else {
        this.logger.warn(
          `No story progress found for character ${characterId} and story ${storyId} to reset.`,
        );
        // Nem dobunk hibát, ha nincs mit resetelni, egyszerűen nem történik semmi.
      }
    });
  }

  // TODO: async resetStoryProgress(characterId: number, storyId: number): Promise<void>
  // Ez törölné a character_story_progress, character_story_inventory, player_progress bejegyzéseket
  // az adott characterId + storyId pároshoz, és újra létrehozná az alap character_story_progress-t.
}
