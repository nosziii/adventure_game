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
import type { CharacterStoryProgressRecord } from './game/interfaces/character-story-progres-record.interface';
import { StoryRecord } from './game/interfaces/story-record.interface';
import { ItemRecord } from './game/interfaces/item-record.interface';
import { AbilityRecord } from './game/interfaces/ability-record.interface';
import {
  SpendableStatName,
  PlayerArchetypeDto,
  SimpleAbilityInfoDto,
} from './character/dto';
import { CharacterArchetypeRecord } from './game/interfaces/character-archetype-record.interface';

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
  talent_points_available: number | null;
  equipped_weapon_id: number | null;
  equipped_armor_id: number | null;
  selected_archetype_id: number | null; // Az archetípus ID-je, ha van kiválasztva
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

const STAT_INCREASE_PER_TALENT_POINT: Record<SpendableStatName, number> = {
  skill: 1,
  luck: 1,
  defense: 1,
  stamina: 5, // Pl. 1 pontért +5 stamina/maxHP
};

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

  async resetStoryProgress(
    characterId: number,
    storyId: number,
  ): Promise<void> {
    this.logger.log(
      `Attempting to reset story progress for Character ID: ${characterId}, Story ID: ${storyId}`,
    );

    await this.knex.transaction(async (trx) => {
      // 1. Keresd meg a character_story_progress rekordot az ID-jához
      const progressToReset = await trx<CharacterStoryProgressRecord>(
        'character_story_progress',
      )
        .where({
          character_id: characterId,
          story_id: storyId,
        })
        .first('id'); // Csak az ID-ra van szükségünk a további törlésekhez

      if (progressToReset && progressToReset.id) {
        const progressId = progressToReset.id;
        this.logger.debug(
          `Found story progress record ID: ${progressId} for character ${characterId}, story ${storyId}. Proceeding with reset.`,
        );

        // 2. Töröld a kapcsolódó player_progress bejegyzéseket
        const deletedPlayerProgress = await trx('player_progress')
          .where({ character_story_progress_id: progressId })
          .del();
        this.logger.debug(
          `Deleted ${deletedPlayerProgress} entries from player_progress for progress ID: ${progressId}`,
        );

        // 3. Töröld a kapcsolódó character_story_inventory bejegyzéseket
        const deletedInventoryItems = await trx('character_story_inventory')
          .where({ character_story_progress_id: progressId })
          .del();
        this.logger.debug(
          `Deleted ${deletedInventoryItems} items from character_story_inventory for progress ID: ${progressId}`,
        );

        // 4. Töröld magát a character_story_progress bejegyzést
        const deletedStoryProgress = await trx('character_story_progress')
          .where({ id: progressId })
          .del();

        if (deletedStoryProgress > 0) {
          this.logger.log(
            `Successfully reset story progress ID: ${progressId} for character ${characterId}, story ${storyId}.`,
          );
        } else {
          // Ennek nem szabadna előfordulnia, ha a progressToReset.id létezett
          this.logger.warn(
            `Story progress ID: ${progressId} was targeted for deletion but not found or not deleted.`,
          );
        }

        // Opcionális: Ha ez volt az aktív sztori, akkor most egyetlen sztori sem lesz aktív ennél a karakternél.
        // Ezt a `startOrContinueStory` vagy a `getActiveStoryProgress` kezeli majd.
      } else {
        this.logger.warn(
          `No story progress found for Character ID: ${characterId} and Story ID: ${storyId}. Nothing to reset.`,
        );
        // Nem dobunk hibát, ha nincs mit resetelni, egyszerűen nem történik semmi.
      }
    }); // Tranzakció vége
  }

  // XP Hozzáadása és Szintlépés Kezelése ---
  async addXp(
    characterId: number, // A base character ID-ja
    xpToAdd: number,
  ): Promise<{
    leveledUp: boolean;
    messages: string[];
    updatedProgress?: CharacterStoryProgressRecord; // Visszaadjuk a frissített progress recordot
  }> {
    if (xpToAdd <= 0) {
      return { leveledUp: false, messages: [] };
    }
    this.logger.log(
      `[CharacterService.addXp] Attempting to add ${xpToAdd} XP for baseCharacterId ${characterId}`,
    );

    const activeStoryProgress = await this.getActiveStoryProgress(characterId);
    if (!activeStoryProgress) {
      this.logger.warn(
        `[CharacterService.addXp] No active story progress found for character ${characterId} to add XP to.`,
      );
      return {
        leveledUp: false,
        messages: ['Nincs aktív sztori, amihez XP-t lehetne adni.'],
      };
    }
    this.logger.debug(
      `[CharacterService.addXp] Found active story progress ID: ${activeStoryProgress.id}. Current Lvl: ${activeStoryProgress.level}, XP: ${activeStoryProgress.xp}/${activeStoryProgress.xp_to_next_level}`,
    );

    let currentXp = activeStoryProgress.xp + xpToAdd;
    let currentLevel = activeStoryProgress.level;
    let currentXpToNext = activeStoryProgress.xp_to_next_level;
    let currentTalentPoints = activeStoryProgress.talent_points_available ?? 0;

    // A stamina és health az activeStoryProgress-ből jön és azt frissítjük
    let currentStamina = activeStoryProgress.stamina;
    let currentHealth = activeStoryProgress.health; // Az aktuális HP-t is frissítjük, ha a stamina nő

    let leveledUp = false;
    const levelUpMessages: string[] = [];
    const pointsPerLevel = 3; // Tehetségpontok szintlépésenként
    const staminaIncreasePerLevel = 10; // Fix stamina növekedés szintlépésenként

    while (currentXp >= currentXpToNext) {
      leveledUp = true;
      currentLevel++;
      const xpOver = currentXp - currentXpToNext;
      currentXp = xpOver;
      // Új xp_to_next_level számítása (a példád alapján, vagy saját képlet)
      currentXpToNext = Math.floor(100 * Math.pow(1.5, currentLevel - 1));

      // 1. Fix Stamina (és HP) növelés
      currentStamina += staminaIncreasePerLevel;
      currentHealth = currentStamina; // HP feltöltése az új maximumra
      levelUpMessages.push(
        `Állóképességed (Stamina/MaxHP) nőtt +${staminaIncreasePerLevel}-el! Jelenlegi: ${currentStamina}. Életerőd teljesen visszatöltődött!`,
      );

      // 2. Tehetségpontok adása
      currentTalentPoints += pointsPerLevel;

      levelUpMessages.push(
        `SZINTLÉPÉS! Elérted a ${currentLevel}. szintet! Kaptál ${pointsPerLevel} tehetségpontot.`,
      );
      this.logger.log(
        `StoryProgress ${activeStoryProgress.id} leveled up to ${currentLevel}. Gained ${pointsPerLevel} talent points. Stamina increased by ${staminaIncreasePerLevel}.`,
      );
    }

    const updates: Partial<CharacterStoryProgressRecord> = {
      level: currentLevel,
      xp: currentXp,
      xp_to_next_level: currentXpToNext,
      talent_points_available: currentTalentPoints,
      stamina: currentStamina,
      health: currentHealth, // Fontos, hogy a HP-t is frissítsük az új staminára
    };

    this.logger.debug(
      `[CharacterService.addXp] Updating story progress ID ${activeStoryProgress.id} with: ${JSON.stringify(updates)}`,
    );
    const updatedProgressRecord = await this.updateStoryProgress(
      activeStoryProgress.id,
      updates,
    );

    return {
      leveledUp,
      messages: levelUpMessages,
      updatedProgress: updatedProgressRecord,
    };
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

    const progressRecord: CharacterStoryProgressRecord =
      await this.knex.transaction(
        async (trx): Promise<CharacterStoryProgressRecord> => {
          // Explicit Promise<CSR> a callbacknek

          this.logger.debug(
            `Clearing any existing active combat for character ${characterId} within transaction.`,
          );
          await trx('active_combats')
            .where({ character_id: characterId })
            .del();

          await trx('character_story_progress')
            .where({ character_id: characterId, is_active: true })
            .andWhereNot({ story_id: storyId })
            .update({ is_active: false, updated_at: new Date() });

          let existingProgress = await trx<CharacterStoryProgressRecord>(
            'character_story_progress',
          )
            .where({ character_id: characterId, story_id: storyId })
            .first();

          let finalProgressRecord: CharacterStoryProgressRecord; // Ezt fogjuk visszaadni

          if (existingProgress) {
            this.logger.log(
              `Continuing existing progress for story ${storyId} for character ${characterId}`,
            );
            const updatedRows = await trx('character_story_progress')
              .where({ id: existingProgress.id }) // existingProgress itt biztosan nem undefined
              .update({
                is_active: true,
                last_played_at: new Date(),
                updated_at: new Date(),
              })
              .returning('*');

            if (!updatedRows?.[0]) {
              this.logger.error(
                `Failed to update or retrieve character_story_progress for id ${existingProgress.id}.`,
              );
              throw new InternalServerErrorException(
                'Failed to update story progress.',
              );
            }
            finalProgressRecord = updatedRows[0];
          } else {
            this.logger.log(
              `Creating new progress for story ${storyId} for character ${characterId}`,
            );

            const baseCharData = await trx<Character>('characters')
              .where({ id: characterId })
              .select('selected_archetype_id')
              .first();

            let archetypeBonuses: Partial<CharacterArchetypeRecord> = {};
            let startingAbilities: number[] = [];
            if (baseCharData?.selected_archetype_id) {
              // ... (archetype adatok lekérése és bónuszok/képességek beállítása, ahogy volt)
            }

            const insertedRows = await trx('character_story_progress')
              .insert({
                character_id: characterId,
                story_id: storyId,
                current_node_id: startingNodeId,
                health:
                  DEFAULT_HEALTH + (archetypeBonuses.base_health_bonus || 0),
                skill: DEFAULT_SKILL + (archetypeBonuses.base_skill_bonus || 0),
                luck: DEFAULT_LUCK + (archetypeBonuses.base_luck_bonus || 0),
                stamina:
                  DEFAULT_STAMINA + (archetypeBonuses.base_stamina_bonus || 0),
                defense:
                  DEFAULT_DEFENSE + (archetypeBonuses.base_defense_bonus || 0),
                level: DEFAULT_LEVEL,
                xp: DEFAULT_XP,
                xp_to_next_level: DEFAULT_XP_TO_NEXT_LEVEL,
                is_active: true,
              })
              .returning('*');

            if (!insertedRows?.[0]) {
              this.logger.error(
                `Failed to insert/retrieve new character_story_progress for char ${characterId}, story ${storyId}.`,
              );
              throw new InternalServerErrorException(
                'Failed to create new story progress.',
              );
            }
            finalProgressRecord = insertedRows[0]; // Most már biztosan CharacterStoryProgressRecord

            // player_progress rögzítése
            await trx('player_progress').insert({
              character_story_progress_id: finalProgressRecord.id, // Itt már a finalProgressRecord-ot használjuk
              node_id: startingNodeId,
              choice_id_taken: null,
            });
            this.logger.debug(
              `Initial player_progress logged for new story progress ${finalProgressRecord.id}`,
            );

            // Kezdő képességek hozzáadása
            if (startingAbilities.length > 0) {
              const abilitiesToInsert = startingAbilities.map((abilityId) => ({
                character_story_progress_id: finalProgressRecord.id,
                ability_id: abilityId,
              }));
              await trx('character_story_abilities')
                .insert(abilitiesToInsert)
                .onConflict()
                .ignore();
              this.logger.debug(
                `Added/ignored starting abilities for progress ${finalProgressRecord.id}`,
              );
            }
          }

          this.logger.debug(
            '[startOrContinueStory] Progress before returning from transaction:',
            JSON.stringify(finalProgressRecord, null, 2),
          );
          return finalProgressRecord; // Itt finalProgressRecord típusa már CharacterStoryProgressRecord
        }, // async (trx) vége
      ); // tranzakció vége

    // Az `if (!progressRecord)` ellenőrzés a tranzakció után maradhat, mint extra biztonsági réteg,
    // de a tranzakció callbackjének explicit Promise<CharacterStoryProgressRecord> típusa miatt
    // a 'progressRecord' típusa már itt is CharacterStoryProgressRecord kell legyen.
    if (!progressRecord) {
      // Ennek elvileg sosem kellene lefutnia
      throw new InternalServerErrorException(
        'Transaction failed to return a progress record.',
      );
    }

    this.logger.debug(
      '[startOrContinueStory] Progress record after transaction:',
      JSON.stringify(progressRecord, null, 2),
    );
    return progressRecord; // A metódus visszatérési típusa Promise<CharacterStoryProgressRecord>
  }
  async spendTalentPointOnStat(
    characterId: number, // Base character ID
    statName: SpendableStatName,
  ): Promise<CharacterStoryProgressRecord> {
    // Visszaadjuk a frissített progress-t
    this.logger.log(
      `Character ${characterId} attempting to spend 1 talent point on stat: ${statName}`,
    );

    const activeStoryProgress = await this.getActiveStoryProgress(characterId);
    if (!activeStoryProgress) {
      throw new NotFoundException(
        'No active story progress found for character to spend talent points.',
      );
    }

    if ((activeStoryProgress.talent_points_available ?? 0) < 1) {
      this.logger.warn(
        `Character progress ${activeStoryProgress.id} has no talent points available.`,
      );
      throw new BadRequestException('Nincs elkölthető tehetségpontod.');
    }

    const pointsToDecrease = 1; // Mindig 1 pontot költünk
    const currentStatValue = activeStoryProgress[statName] ?? 0; // Null kezelés, ha a stat lehet null
    const increaseAmount = STAT_INCREASE_PER_TALENT_POINT[statName];

    if (increaseAmount === undefined) {
      this.logger.error(
        `Invalid statName "${statName}" provided for spending talent point.`,
      );
      throw new BadRequestException(`Érvénytelen statisztika: ${statName}`);
    }

    const newStatValue = currentStatValue + increaseAmount;
    const newTalentPointsAvailable =
      (activeStoryProgress.talent_points_available ?? 0) - pointsToDecrease;

    const updates: Partial<CharacterStoryProgressRecord> = {
      [statName]: newStatValue,
      talent_points_available: newTalentPointsAvailable,
    };

    // Ha a stamina nőtt, a health-et is fel kell tölteni az új maximumra
    if (statName === 'stamina') {
      updates.health = newStatValue; // Az új stamina érték lesz az új maxHP és egyben az új HP
      this.logger.log(
        `Stamina increased to ${newStatValue}, health refilled to ${newStatValue}.`,
      );
    }

    this.logger.debug(
      `Updating story progress ${activeStoryProgress.id} after spending talent point. Updates: ${JSON.stringify(updates)}`,
    );
    return this.updateStoryProgress(activeStoryProgress.id, updates);
  }

  // Karakter keresése vagy létrehozása userId alapján
  async findOrCreateByUserId(
    userId: number,
    preferredArchetypeId?: number | null,
  ): Promise<Character> {
    let character = await this.knex<Character>('characters')
      .where({ user_id: userId })
      .first();
    if (character) {
      this.logger.debug(
        `Found existing character ID ${character.id} for user ID ${userId}`,
      );
      // Ha van preferredArchetypeId és a karakternek még nincs, vagy frissíteni akarjuk:
      if (
        preferredArchetypeId &&
        character.selected_archetype_id !== preferredArchetypeId
      ) {
        this.logger.log(
          `Updating selected_archetype_id for character ${character.id} to ${preferredArchetypeId}`,
        );
        const [updatedCharacter] = await this.knex('characters')
          .where({ id: character.id })
          .update({
            selected_archetype_id: preferredArchetypeId,
            updated_at: new Date(),
          })
          .returning('*');
        character = updatedCharacter || character; // Ha az update nem ad vissza, marad a régi
      }
    } else {
      this.logger.log(
        `No character found for user ID ${userId}. Creating new character.`,
      );
      const defaultName = 'Kalandor'; // Vagy az archetípusból származtatott név
      const [newCharacter] = await this.knex('characters')
        .insert({
          user_id: userId,
          name: defaultName,
          role: 'player', // Alapértelmezett szerepkör
          selected_archetype_id: preferredArchetypeId, // Itt állítjuk be
        })
        .returning('*');

      if (!newCharacter) {
        // Biztonsági ellenőrzés
        this.logger.error(
          `Failed to create or retrieve new character for user ID ${userId}.`,
        );
        throw new InternalServerErrorException(
          'Character creation failed unexpectedly.',
        );
      }
      character = newCharacter;
      this.logger.log(
        `New character created with ID: ${character!.id}, ArchetypeID: ${preferredArchetypeId}`,
      );
    }
    if (!character)
      throw new InternalServerErrorException(
        'Failed to find or create character.',
      );
    return character; // Visszaadja a baseCharacter-t (effektek nélkül)
  }

  async getSelectableArchetypes(): Promise<PlayerArchetypeDto[]> {
    this.logger.log(
      'Fetching selectable character archetypes for players with ability details',
    );
    try {
      const archetypes = await this.knex<CharacterArchetypeRecord>(
        'character_archetypes',
      )
        // .where({ is_player_selectable: true }) // Ha lenne ilyen flag
        .select('*') // Most minden oszlop kell az archetípusból
        .orderBy('name', 'asc');

      const result: PlayerArchetypeDto[] = [];

      for (const arch of archetypes) {
        let abilitiesDetails: SimpleAbilityInfoDto[] = [];
        if (arch.starting_ability_ids && arch.starting_ability_ids.length > 0) {
          const abilities = await this.knex<AbilityRecord>('abilities')
            .whereIn('id', arch.starting_ability_ids)
            .select('id', 'name', 'description');
          abilitiesDetails = abilities.map((a) => ({
            id: a.id,
            name: a.name,
            description: a.description,
          }));
        }

        result.push({
          id: arch.id,
          name: arch.name,
          description: arch.description,
          iconPath: arch.icon_path,
          baseHealthBonus: arch.base_health_bonus,
          baseSkillBonus: arch.base_skill_bonus,
          baseLuckBonus: arch.base_luck_bonus,
          baseStaminaBonus: arch.base_stamina_bonus,
          baseDefenseBonus: arch.base_defense_bonus,
          startingAbilities: abilitiesDetails,
        });
      }
      return result;
    } catch (error) {
      this.logger.error(
        'Failed to fetch selectable archetypes with abilities',
        error.stack,
      );
      throw new InternalServerErrorException(
        'Could not retrieve character archetypes.',
      );
    }
  }
  // Karakter archetípusának beállítása
  async selectArchetypeForCharacter(
    characterId: number,
    archetypeId: number,
  ): Promise<Character> {
    this.logger.log(
      `Character ${characterId} attempting to select archetype ID: ${archetypeId}`,
    );

    // Ellenőrizzük, hogy létezik-e ilyen archetípus (opcionális, de ajánlott)
    const archetypeExists = await this.knex('character_archetypes')
      .where({ id: archetypeId })
      .first();
    if (!archetypeExists) {
      this.logger.warn(
        `Attempted to select non-existent archetype ID: ${archetypeId} for character ${characterId}`,
      );
      throw new NotFoundException(
        `Archetype with ID ${archetypeId} not found.`,
      );
    }

    const [updatedCharacter] = await this.knex('characters')
      .where({ id: characterId })
      .update({
        selected_archetype_id: archetypeId,
        updated_at: new Date(),
      })
      .returning('*'); // Visszaadjuk a teljes frissített karakter sort

    if (!updatedCharacter) {
      // Ennek nem szabadna előfordulnia, ha a characterId valid
      this.logger.error(
        `Failed to update archetype for character ID ${characterId}. Character not found.`,
      );
      throw new NotFoundException(
        `Character with ID ${characterId} not found for archetype update.`,
      );
    }
    this.logger.log(
      `Character ${characterId} successfully selected archetype ID: ${archetypeId}`,
    );

    // Nem kell itt applyPassiveEffects, mert ez csak a base character-t érinti.
    // Az effektek akkor kerülnek alkalmazásra, amikor a GameService egy sztorihoz
    // létrehozza/betölti a character_story_progress-t.
    return updatedCharacter;
  }
}
