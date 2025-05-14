// src/game.service.ts - JAVÍTOTT
import {
  Injectable,
  Inject,
  NotFoundException,
  Logger,
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Knex } from 'knex';
import { KNEX_CONNECTION } from '../database/database.module';
import { CharacterService, Character } from '../character.service';
import {
  GameStateDto,
  ChoiceDto,
  EnemyDataDto,
  CharacterStatsDto,
  CombatActionDto,
  InventoryItemDto,
  PlayerProgressStepDto,
  PlayerMapDataDto,
  PlayerMapNodeDto,
  PlayerMapEdgeDto,
} from './dto';
import { StoryNode } from './interfaces/story-node.interface';
import { ChoiceRecord } from './interfaces/choice-record.interface';
import { EnemyRecord } from './interfaces/enemy-record.interface';
import { PlayerProgressRecord } from './interfaces/player-progress.interface';
import { CombatService, CombatResult } from '../combat.service';

const STARTING_NODE_ID = 1;

@Injectable()
export class GameService {
  private readonly logger = new Logger(GameService.name);

  constructor(
    @Inject(KNEX_CONNECTION) private readonly knex: Knex, // Knex közvetlen injektálása
    private readonly characterService: CharacterService,
    private readonly combatService: CombatService, // Harc szolgáltatás
  ) {}

  // Segédfüggvény a Character -> CharacterStatsDto átalakításhoz
  private mapCharacterToDto(character: Character): CharacterStatsDto {
    return {
      health: character.health,
      skill: character.skill,
      luck: character.luck,
      stamina: character.stamina,
      name: character.name,
      level: character.level,
      xp: character.xp,
      xpToNextLevel: character.xp_to_next_level,
      defense: character.defense,
    };
  }

  // A GameController ezt fogja hívni
  async processCombatAction(
    userId: number,
    actionDto: CombatActionDto,
  ): Promise<GameStateDto> {
    this.logger.log(`GameService processing combat action for user ${userId}`);
    // Meghívjuk a CombatService-t
    const combatResult: CombatResult =
      await this.combatService.handleCombatAction(userId, actionDto);

    // Lekérdezzük a legfrissebb inventoryt a frissített karakterhez
    // A combatResult.character már a harc utáni/közbeni állapotot tükrözi
    const inventory = await this.characterService.getInventory(
      combatResult.character.id,
    );
    const characterForDto = this.mapCharacterToDto(combatResult.character);

    if (combatResult.isCombatOver) {
      this.logger.log(
        `Combat finished for user ${userId}. New node: ${combatResult.nextNodeId}`,
      );
      // A karakter current_node_id-ja már frissítve van a CombatService által.
      // Most a getCurrentGameState-et hívjuk, ami az új node-ot adja vissza.
      // DE! A getCurrentGameState újra lekérdezné a karaktert. Egyszerűbb itt összeállítani.

      const finalNode = combatResult.nextNodeId
        ? await this.knex<StoryNode>('story_nodes')
            .where({ id: combatResult.nextNodeId })
            .first()
        : null; // Ha valamiért nincs nextNodeId (nem kellene)

      const choicesForFinalNode =
        finalNode && !finalNode.is_end
          ? await this.knex<ChoiceRecord>('choices')
              .where({ source_node_id: finalNode.id })
              .then((potentialChoices) =>
                Promise.all(
                  potentialChoices.map(async (choice) => ({
                    id: choice.id,
                    text: choice.text,
                    isAvailable: await this.checkChoiceAvailability(
                      choice,
                      combatResult.character,
                    ),
                  })),
                ),
              )
          : [];

      return {
        node: finalNode
          ? { id: finalNode.id, text: finalNode.text, image: finalNode.image }
          : null,
        choices: choicesForFinalNode,
        character: characterForDto,
        combat: null, // Harc véget ért
        inventory: inventory,
        messages: combatResult.combatLogMessages,
        equippedWeaponId: combatResult.character.equipped_weapon_id,
        equippedArmorId: combatResult.character.equipped_armor_id,
      };
    } else {
      // Harc folytatódik
      this.logger.log(`Combat continues for user ${userId}.`);
      return {
        node: null,
        choices: [],
        character: characterForDto,
        combat: combatResult.enemy ?? null, // A CombatService által visszaadott frissített enemy állapot
        inventory: inventory,
        messages: combatResult.combatLogMessages,
        equippedWeaponId: combatResult.character.equipped_weapon_id,
        equippedArmorId: combatResult.character.equipped_armor_id,
      };
    }
  }

  // --- getCurrentGameState ---
  async getCurrentGameState(userId: number): Promise<GameStateDto> {
    this.logger.log(`Workspaceing game state for user ID: ${userId}`);
    const character = await this.characterService.findOrCreateByUserId(userId);
    this.logger.debug(
      'Character data fetched/created:',
      JSON.stringify(character, null, 2),
    );

    // Ellenőrizzük az aktív harcot
    const activeCombat = await this.knex('active_combats')
      .where({ character_id: character.id })
      .first();

    let inventory: InventoryItemDto[] | null = null;

    this.logger.debug(
      `Workspaceing inventory for character ID: ${character.id}`,
    );

    if (activeCombat) {
      // --- HARCBAN VAN ---
      this.logger.log(
        `User ${userId} is in active combat (Combat ID: ${activeCombat.id}, Enemy ID: ${activeCombat.enemy_id})`,
      );
      const enemyBaseData = await this.knex<EnemyRecord>('enemies')
        .where({ id: activeCombat.enemy_id })
        .first();

      if (!enemyBaseData) {
        this.logger.error(
          `Enemy data not found for active combat! Enemy ID: ${activeCombat.enemy_id}`,
        );
        await this.knex('active_combats').where({ id: activeCombat.id }).del();
        throw new InternalServerErrorException(
          'Combat data corrupted, enemy not found.',
        );
      }

      inventory = await this.characterService.getInventory(character.id);
      this.logger.debug(
        'Inventory data fetched:',
        JSON.stringify(inventory, null, 2),
      );

      // EnemyDataDto összeállítása
      const enemyData: EnemyDataDto = {
        id: enemyBaseData.id,
        name: enemyBaseData.name,
        health: enemyBaseData.health,
        currentHealth: activeCombat.enemy_current_health,
        skill: enemyBaseData.skill,
      };

      return {
        node: null,
        choices: [],
        character: this.mapCharacterToDto(character), // Használjuk a segédfüggvényt
        combat: enemyData,
        inventory: inventory,
        messages: [],
        equippedWeaponId: character.equipped_weapon_id,
        equippedArmorId: character.equipped_armor_id,
      };
    } else {
      // --- NINCS HARCBAN ---
      this.logger.log(
        `User ${userId} is not in combat. Current node: ${character.current_node_id}`,
      );
      let currentNodeId = character.current_node_id ?? STARTING_NODE_ID;
      inventory = await this.characterService.getInventory(character.id);

      if (character.current_node_id !== currentNodeId) {
        this.logger.warn(
          `Character ${character.id} had null current_node_id, setting to STARTING_NODE_ID ${STARTING_NODE_ID}`,
        );
        // Frissítés és a frissített karakteradatok lekérése
        const updatedCharacter = await this.characterService.updateCharacter(
          character.id,
          { current_node_id: currentNodeId },
        );
        // Biztosítjuk, hogy a 'character' változó a legfrissebb adatokat tartalmazza
        Object.assign(character, updatedCharacter); // Frissítjük a meglévő objektumot, vagy használjuk közvetlenül az updatedCharacter-t
      }

      this.logger.debug(`Workspaceing story node with ID: ${currentNodeId}`);
      const currentNode = await this.knex<StoryNode>('story_nodes') // Használjuk a this.knex-et
        .where({ id: currentNodeId })
        .first();

      if (!currentNode) {
        this.logger.error(`Story node ${currentNodeId} not found!`);
        throw new NotFoundException(`Story node ${currentNodeId} not found.`);
      }
      this.logger.debug(`Found story node: ${currentNode.id}`);

      this.logger.debug(
        `Workspaceing and evaluating choices for source node ID: ${currentNodeId}`,
      );
      const potentialChoices = await this.knex<ChoiceRecord>('choices').where({
        source_node_id: currentNodeId,
      });

      // Mivel a checkChoiceAvailability aszinkron lett, Promise.all-t használunk
      const availableChoicesPromises = potentialChoices.map(async (choice) => {
        const isAvailable = await this.checkChoiceAvailability(
          choice,
          character,
        ); // await itt!
        this.logger.debug(
          `Choice ${choice.id} (${choice.text}) - Evaluated Availability: ${isAvailable}`,
        );
        return {
          // Visszaadjuk a teljes ChoiceDto-t
          id: choice.id,
          text: choice.text,
          isAvailable: isAvailable,
        };
      });

      // Megvárjuk az összes ellenőrzést
      const availableChoices: ChoiceDto[] = await Promise.all(
        availableChoicesPromises,
      );

      this.logger.debug(`Evaluated ${availableChoices.length} choices.`);

      return {
        node: {
          id: currentNode.id,
          text: currentNode.text,
          image: currentNode.image,
        },
        choices: availableChoices,
        character: this.mapCharacterToDto(character), // Használjuk a segédfüggvényt
        combat: null,
        inventory: inventory,
        messages: [],
        equippedWeaponId: character.equipped_weapon_id,
        equippedArmorId: character.equipped_armor_id,
      };
    } // if (activeCombat) vége
  } // getCurrentGameState vége

  // --- checkChoiceAvailability ---
  private async checkChoiceAvailability(
    choice: ChoiceRecord,
    character: Character,
  ): Promise<boolean> {
    /**
     * Ellenőrizzük a választás elérhetőségét:
     * - Ha a választásnak van 'required_item_id' mezője, ellenőrizzük, hogy a karakter birtokolja-e azt az itemet.
     * - Ha a választásnak van 'item_cost_id' mezője, ellenőrizzük, hogy a karakter birtokolja-e azt az itemet.
     */
    if (
      choice.required_item_id !== null &&
      choice.required_item_id !== undefined
    ) {
      this.logger.debug(
        `Checking required item ID: ${choice.required_item_id}`,
      );
      const hasRequiredItem = await this.characterService.hasItem(
        character.id,
        choice.required_item_id,
      );
      if (!hasRequiredItem) {
        this.logger.debug(
          `Choice ${choice.id} unavailable: Missing required item ${choice.required_item_id}`,
        );
        return false; // Ha hiányzik a tárgy, a választás nem elérhető
      }
      this.logger.debug(
        `Required item ${choice.required_item_id} found in inventory.`,
      );
    }

    if (choice.item_cost_id !== null && choice.item_cost_id !== undefined) {
      this.logger.debug(`Checking item cost ID: ${choice.item_cost_id}`);
      // Itt is azt kell ellenőrizni, hogy van-e neki legalább 1 db
      const hasCostItem = await this.characterService.hasItem(
        character.id,
        choice.item_cost_id,
      );
      if (!hasCostItem) {
        this.logger.debug(
          `Choice ${choice.id} unavailable: Missing cost item ${choice.item_cost_id}`,
        );
        return false; // Ha nincs meg a tárgy, amibe kerülne, nem választható
      }
      this.logger.debug(
        `Required cost item ${choice.item_cost_id} found in inventory.`,
      );
    }

    const reqStatCheck = choice.required_stat_check;
    if (typeof reqStatCheck === 'string') {
      this.logger.debug(`Evaluating stat requirement: "${reqStatCheck}"`);
      const parts = reqStatCheck.match(/(\w+)\s*(>=|<=|>|<|==|!=)\s*(\d+)/);
      if (parts) {
        const [, stat, operator, valueStr] = parts;
        const requiredValue = parseInt(valueStr, 10);
        let characterValue: number | null | undefined;

        switch (stat.toLowerCase()) {
          case 'skill':
            characterValue = character.skill;
            break;
          case 'health':
            characterValue = character.health;
            break;
          case 'luck':
            characterValue = character.luck;
            break;
          case 'stamina':
            characterValue = character.stamina;
            break;
          default:
            this.logger.warn(`Unknown stat in requirement: ${stat}`);
            return false;
        }

        if (characterValue === null || characterValue === undefined) {
          this.logger.debug(
            `Stat ${stat} is null/undefined for character ${character.id}`,
          );
          return false;
        }

        this.logger.debug(
          `Checking: <span class="math-inline">\{stat\} \(</span>{characterValue}) ${operator} ${requiredValue}`,
        );

        let conditionMet = false;
        switch (operator) {
          case '>=':
            conditionMet = characterValue >= requiredValue;
            break;
          case '<=':
            conditionMet = characterValue <= requiredValue;
            break;
          case '>':
            conditionMet = characterValue > requiredValue;
            break;
          case '<':
            conditionMet = characterValue < requiredValue;
            break;
          case '==':
            conditionMet = characterValue == requiredValue;
            break;
          case '!=':
            conditionMet = characterValue != requiredValue;
            break;
          default:
            this.logger.warn(`Unknown operator in requirement: ${operator}`);
            return false;
        }
        this.logger.debug(
          `Requirement ${reqStatCheck} result: ${conditionMet}`,
        );
        if (!conditionMet) {
          return false; // Ha a stat feltétel nem teljesül
        }
      } else {
        this.logger.warn(
          `Could not parse stat requirement string: ${reqStatCheck}`,
        );
        return false;
      }
    } // Stat check vége
    // Ha nem volt stat feltétel, vagy az teljesült (és más feltétel sem bukott meg):
    return true;
  } // checkChoiceAvailability vége

  // --- makeChoice ---
  async makeChoice(userId: number, choiceId: number): Promise<GameStateDto> {
    this.logger.log(`Processing choice ID: ${choiceId} for user ID: ${userId}`);
    const character = await this.characterService.findOrCreateByUserId(userId);

    // Ellenőrizzük a harcot (változatlan)
    const existingCombat = await this.knex('active_combats')
      .where({ character_id: character.id })
      .first();
    if (existingCombat) {
      throw new ForbiddenException('Cannot make choices while in combat.');
    }

    const currentNodeId = character.current_node_id;
    if (!currentNodeId) {
      throw new BadRequestException(
        'Cannot make a choice without being at a node.',
      );
    }

    // Lekérdezzük az AKTUÁLIS node-ot is, hogy az effektjeit/jutalmait kezeljük
    const currentNode = await this.knex<StoryNode>('story_nodes')
      .where({ id: currentNodeId })
      .first();
    if (!currentNode) {
      throw new NotFoundException(`Current node ${currentNodeId} not found!`);
    } // Extra ellenőrzés

    // Választás validálása (változatlan)
    const choice = await this.knex<ChoiceRecord>('choices')
      .where({ id: choiceId, source_node_id: currentNodeId })
      .first();
    if (!choice) {
      throw new BadRequestException(`Invalid choice ID: ${choiceId}`);
    }
    if (!(await this.checkChoiceAvailability(choice, character))) {
      // checkAvailability most már async!
      throw new ForbiddenException(
        'You do not meet the requirements for this choice.',
      );
    }

    if (choice.item_cost_id !== null && choice.item_cost_id !== undefined) {
      this.logger.log(
        `Choice ${choiceId} has item cost: ${choice.item_cost_id}. Attempting to remove from inventory.`,
      );
      const removedSuccessfully =
        await this.characterService.removeItemFromInventory(
          character.id,
          choice.item_cost_id,
          1,
        );
      if (!removedSuccessfully) {
        this.logger.error(
          `Failed to remove cost item ${choice.item_cost_id} for choice ${choiceId} - item might have vanished?`,
        );
        throw new InternalServerErrorException('Failed to process item cost.');
      }
      this.logger.log(
        `Item ${choice.item_cost_id} successfully removed as cost.`,
      );
      // combatLogMessages.push(`Felhasználtál egy tárgyat: ${choice.item_cost_id}`); // TODO: Tárgy nevét kiírni
    }

    const targetNodeId = choice.target_node_id;
    this.logger.debug(
      `Choice ${choiceId} valid. Target node ID: ${targetNodeId}`,
    );

    const targetNode = await this.knex<StoryNode>('story_nodes')
      .where({ id: targetNodeId })
      .first();
    if (!targetNode) {
      throw new InternalServerErrorException('Target node missing.');
    }

    // --- Effekt/Jutalom Alkalmazása a FORRÁS (currentNode) alapján MIELŐTT lépünk ---
    let healthUpdate = character.health;
    // Health effect (az aktuális node-on, ha van)
    if (
      currentNode.health_effect !== null &&
      currentNode.health_effect !== undefined
    ) {
      this.logger.log(
        `Applying health effect ${currentNode.health_effect} from current node ${currentNodeId}`,
      );
      healthUpdate = Math.max(0, character.health + currentNode.health_effect);
    }

    // Item reward (az aktuális node-on, ha van)
    if (
      currentNode.item_reward_id !== null &&
      currentNode.item_reward_id !== undefined
    ) {
      this.logger.log(
        `Current node ${currentNodeId} grants item reward ID: ${currentNode.item_reward_id}`,
      );
      try {
        await this.characterService.addItemToInventory(
          character.id,
          currentNode.item_reward_id,
          1,
        );
        this.logger.log(
          `Item ${currentNode.item_reward_id} added to inventory.`,
        );
      } catch (itemError) {
        this.logger.error(
          `Failed to add item reward ${currentNode.item_reward_id}: ${itemError}`,
        );
      }
    }
    // TODO: Item cost levonása (a choice alapján) itt történjen

    // --- Most jön a továbblépés vagy harc indítása ---
    if (targetNode.enemy_id) {
      // HARC KEZDŐDIK (a cél node alapján)
      this.logger.log(
        `Choice leads to combat! Node ${targetNodeId} has enemy ID: ${targetNode.enemy_id}`,
      );
      // Karakter HP frissítése az esetleges forrás node effekt miatt
      if (healthUpdate !== character.health) {
        await this.characterService.updateCharacter(character.id, {
          health: healthUpdate,
        });
      }
      // Harc rekord létrehozása (változatlan)
      const enemy = await this.knex<EnemyRecord>('enemies')
        .where({ id: targetNode.enemy_id })
        .first();
      if (!enemy) {
        throw new InternalServerErrorException(
          'Enemy data missing for combat.',
        );
      }
      await this.knex('active_combats').insert({
        character_id: character.id, // A karakter ID-ja
        enemy_id: enemy.id, // Az ellenfél ID-ja
        enemy_current_health: enemy.health, // Kezdő HP = Max HP az enemies táblából
      });
      // Node ID NEM változik még

      // --- Haladás rögzítése a HARCI node-ra lépéskor ---
      await this.knex('player_progress').insert({
        character_id: character.id,
        node_id: targetNodeId, // A harcot tartalmazó node ID-ja
        choice_id_taken: choice.id, // A választás, ami a harchoz vezetett
      });
    } else {
      // NINCS HARC, TOVÁBBLÉPÉS
      this.logger.log(`Choice leads to non-combat node ${targetNodeId}`);
      // Karakter frissítése: ÚJ node ID ÉS az esetlegesen módosult HP
      await this.characterService.updateCharacter(character.id, {
        current_node_id: targetNodeId,
        health: healthUpdate, // A forrás node effektje már benne van
      });

      // --- Haladás rögzítése a normál node-ra lépéskor ---
      await this.knex('player_progress').insert({
        character_id: character.id,
        node_id: targetNodeId, // Az új, elért node ID-ja
        choice_id_taken: choice.id, // A választás, ami ide vezetett
      });
    }

    // Visszaadjuk az új állapotot
    this.logger.log(
      `Choice processed for user ${userId}. Fetching new game state.`,
    );
    return this.getCurrentGameState(userId); // Ez lekéri az aktuális állapotot (ami lehet harc vagy az új node)
  } // makeChoice vége

  async useItemOutOfCombat(
    userId: number,
    itemId: number,
  ): Promise<CharacterStatsDto> {
    this.logger.log(
      `Attempting to use item ${itemId} for user ${userId} outside of combat.`,
    );

    // 1. Ellenőrizzük, hogy nincs-e harcban
    const character = await this.characterService.findOrCreateByUserId(userId); // Kell a karakter
    const activeCombat = await this.knex('active_combats')
      .where({ character_id: character.id })
      .first();
    if (activeCombat) {
      this.logger.warn(
        `User ${userId} tried to use item ${itemId} outside combat, but is in combat.`,
      );
      throw new ForbiddenException(
        'Cannot use items this way while in combat.',
      );
    }

    // 2. Van-e ilyen tárgya és használható-e?
    const hasItem = await this.characterService.hasItem(character.id, itemId);
    if (!hasItem) {
      this.logger.warn(
        `User ${userId} tried to use item ${itemId} but doesn't have it.`,
      );
      throw new BadRequestException('You do not have this item.');
    }

    const item = await this.knex('items').where({ id: itemId }).first();
    if (!item) {
      throw new InternalServerErrorException('Item data inconsistency.');
    }

    if (!item.usable) {
      this.logger.warn(
        `User ${userId} tried to use non-usable item ${itemId}.`,
      );
      throw new BadRequestException(`This item (${item.name}) cannot be used.`);
    }

    // 3. Effektus alkalmazása (egyelőre csak heal)
    let characterStatsUpdated = false;
    if (item.effect && item.effect.startsWith('heal+')) {
      const healAmount = parseInt(item.effect.split('+')[1] ?? '0', 10);
      if (healAmount > 0) {
        const maxHp = 100; // TODO: Használj valós max HP-t
        const currentHealth = character.health;
        const newHealth = Math.min(maxHp, currentHealth + healAmount);

        if (newHealth > currentHealth) {
          // Csak akkor használjuk el, ha tényleg gyógyít
          this.logger.log(
            `Applying heal effect: ${healAmount} to character ${character.id}. New health: ${newHealth}`,
          );
          await this.characterService.updateCharacter(character.id, {
            health: newHealth,
          });
          // Tárgy eltávolítása
          const removed = await this.characterService.removeItemFromInventory(
            character.id,
            itemId,
            1,
          );
          if (!removed) {
            this.logger.error(
              `Failed to remove item ${itemId} after use for character ${character.id}!`,
            );
            // Lehet, hogy itt vissza kellene vonni a HP update-et? Vagy csak logolni.
          }
          characterStatsUpdated = true; // Jelezzük, hogy volt változás
        } else {
          this.logger.log(
            `Character ${character.id} health already full, item ${itemId} not consumed.`,
          );
          // Itt nem dobunk hibát, csak nem történt semmi.
        }
      } else {
        this.logger.warn(`Item ${itemId} has zero heal amount.`);
      }
    } else {
      // TODO: Más típusú tárgyak használata harcon kívül (pl. kulcs?)
      this.logger.warn(
        `Item ${itemId} has unhandled usable effect: ${item.effect}`,
      );
      throw new BadRequestException(
        `Cannot use this type of item (${item.name}) right now.`,
      );
    }

    // 4. Frissített karakter adatok visszaadása
    // Ha volt változás, újra lekérdezzük, hogy a legfrissebbet adjuk vissza
    const finalCharacter = characterStatsUpdated
      ? await this.characterService.findById(character.id)
      : character; // Ha nem volt változás, jó a régi

    if (!finalCharacter) {
      // Extra check
      throw new InternalServerErrorException(
        'Character data not found after using item.',
      );
    }

    return this.mapCharacterToDto(finalCharacter); // Csak a statokat adjuk vissza
  } // useItemOutOfCombat vége

  // --- Játékos haladásának lekérdezése ---
  async getPlayerProgress(userId: number): Promise<PlayerMapDataDto> {
    this.logger.log(`Workspaceing rich player progress for user ID: ${userId}`);
    const character = await this.characterService.findOrCreateByUserId(userId);
    if (!character) {
      return { nodes: [], edges: [] };
    }

    const progressRecords = await this.knex<PlayerProgressRecord>(
      'player_progress',
    )
      .where({ character_id: character.id })
      .orderBy('visited_at', 'asc');

    if (progressRecords.length === 0) {
      return { nodes: [], edges: [] };
    }

    const nodeIds = new Set<number>();
    const choiceIds = new Set<number>();

    progressRecords.forEach((record) => {
      nodeIds.add(record.node_id);
      if (record.choice_id_taken) {
        choiceIds.add(record.choice_id_taken);
      }
    });

    // Node adatok lekérése
    const nodesData = await this.knex<StoryNode>('story_nodes')
      .whereIn('id', Array.from(nodeIds))
      .select('id', 'text'); // Csak ami kell

    const mapNodes: PlayerMapNodeDto[] = nodesData.map((n) => ({
      id: n.id,
      textSnippet: n.text.substring(0, 30) + (n.text.length > 30 ? '...' : ''),
    }));

    // Choice adatok lekérése (ha vannak)
    let choicesData: ChoiceRecord[] = [];
    if (choiceIds.size > 0) {
      choicesData = await this.knex<ChoiceRecord>('choices')
        .whereIn('id', Array.from(choiceIds))
        .select('id', 'text', 'source_node_id'); // Kell a source_node_id az élekhez
    }
    const choicesCache = new Map(choicesData.map((c) => [c.id, c]));

    // Élek összeállítása
    const mapEdges: PlayerMapEdgeDto[] = [];
    let previousNodeId: number | null = null;

    for (const record of progressRecords) {
      let fromNode: number | null = null;
      let choiceText: string | undefined = undefined; // Alapértelmezett

      if (record.choice_id_taken) {
        const choice = choicesCache.get(record.choice_id_taken);
        if (choice) {
          // Ellenőrizzük, hogy a choice létezik-e
          fromNode = choice.source_node_id;
          if (choice.text) {
            // Ellenőrizzük, hogy a choice.text létezik-e
            choiceText =
              choice.text.substring(0, 20) +
              (choice.text.length > 20 ? '...' : '');
          }
        } else {
          // Ha a choice_id_taken meg van adva, de nem találjuk a choice-t a cache-ben,
          // az adatkonzisztencia problémát jelezhet. Használjuk az előző node-ot.
          this.logger.warn(
            `Choice with ID ${record.choice_id_taken} not found in cache for progress record.`,
          );
          fromNode = previousNodeId;
        }
      } else {
        // Ez a kezdő node, vagy harc utáni node, nincs 'choice_id_taken'
        fromNode = null; // Nincs explicit 'from' a kezdőpontnál
      }

      mapEdges.push({
        from: fromNode,
        to: record.node_id,
        choiceTextSnippet: choiceText, // Itt már a biztonságosan kezelt értéket használjuk
      });
      previousNodeId = record.node_id;
    }

    // Távolítsuk el a duplikált éleket, ha ugyanazt az utat többször bejárta
    // Egyszerűbb lehet a frontend oldalon kezelni, vagy a query-t finomítani
    // Most egy egyszerűbb megoldás:
    const uniqueEdges = mapEdges.filter(
      (edge, index, self) =>
        index ===
        self.findIndex((e) => e.from === edge.from && e.to === edge.to),
    );

    return { nodes: mapNodes, edges: uniqueEdges };
  }
} // GameService vége
