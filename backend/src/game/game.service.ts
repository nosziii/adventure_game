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
  StoryInfoDto,
  PlayerStoryListItemDto,
} from './dto';
import { StoryNode } from './interfaces/story-node.interface';
import { ItemRecord } from './interfaces/item-record.interface';
import { ChoiceRecord } from './interfaces/choice-record.interface';
import { EnemyRecord } from './interfaces/enemy-record.interface';
import { CharacterStoryProgressRecord } from './interfaces/character-story-progres-record.interface';
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
      talentPointsAvailable: character.talent_points_available,
    };
  }
  // A GameController ezt fogja hívni
  async processCombatAction(
    userId: number, // Ezt a userId-t használjuk a baseCharacter és az activeStoryProgress lekéréséhez
    actionDto: CombatActionDto,
  ): Promise<GameStateDto> {
    this.logger.log(
      `[GameService.processCombatAction] UserID: ${userId}, Action: ${actionDto.action}`,
    );

    const combatResult: CombatResult =
      await this.combatService.handleCombatAction(userId, actionDto);

    const finalCharacterAfterCombat = combatResult.character;
    const baseCharacterId = finalCharacterAfterCombat.id; // Ez a characters.id

    // Szükségünk van az aktív sztori progresszió ID-jára az inventoryhoz és a choice checkhez
    const activeStoryProgress =
      await this.characterService.getActiveStoryProgress(baseCharacterId);
    if (!activeStoryProgress) {
      // Ennek nem szabadna előfordulnia, ha a harc éppen zajlott, vagy épp most ért véget.
      this.logger.error(
        `[processCombatAction] CRITICAL: No active story progress found for character ${baseCharacterId} after combat action!`,
      );
      throw new InternalServerErrorException(
        'Failed to retrieve active story progress after combat action.',
      );
    }
    const storyProgressId = activeStoryProgress.id;

    // Helyes inventory lekérdezés a sztori-specifikus progresszió alapján
    const inventory =
      await this.characterService.getStoryInventory(storyProgressId);
    this.logger.debug(
      `[processCombatAction] Inventory fetched for StoryProgressID: ${storyProgressId}`,
    );

    const characterForDto = this.mapCharacterToDto(finalCharacterAfterCombat);

    if (combatResult.isCombatOver) {
      this.logger.log(
        `[processCombatAction] Combat finished. NextNodeID: ${combatResult.nextNodeId}`,
      );

      const finalNode = combatResult.nextNodeId
        ? await this.knex<StoryNode>('story_nodes')
            .where({ id: combatResult.nextNodeId })
            .first()
        : null;

      const choicesForFinalNode =
        finalNode && !finalNode.is_end
          ? await this.knex<ChoiceRecord>('choices')
              .where({ source_node_id: finalNode.id })
              .then((potentialChoices) =>
                Promise.all(
                  potentialChoices.map(async (choice) => ({
                    id: choice.id,
                    text: choice.text,
                    // A checkChoiceAvailability-nek a frissített karakterállapotot (finalCharacterAfterCombat)
                    // és a helyes storyProgressId-t adjuk át.
                    isAvailable: await this.checkChoiceAvailability(
                      choice,
                      finalCharacterAfterCombat,
                      storyProgressId, // <-- HELYES ID
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
        combat: null,
        inventory: inventory, // Helyesen a sztori-specifikus leltár
        roundActions: combatResult.roundActions,
        equippedWeaponId: finalCharacterAfterCombat.equipped_weapon_id,
        equippedArmorId: finalCharacterAfterCombat.equipped_armor_id,
        // messages: ... ha lenne
      };
    } else {
      // Harc folytatódik
      this.logger.log(`[processCombatAction] Combat continues.`);
      return {
        node: null,
        choices: [],
        character: characterForDto,
        combat: combatResult.enemy ?? null,
        inventory: inventory, // Helyesen a sztori-specifikus leltár
        roundActions: combatResult.roundActions,
        equippedWeaponId: finalCharacterAfterCombat.equipped_weapon_id,
        equippedArmorId: finalCharacterAfterCombat.equipped_armor_id,
      };
    }
  }

  // --- getCurrentGameState ---
  async getCurrentGameState(userId: number): Promise<GameStateDto> {
    this.logger.log(`Workspaceing game state for user ID: ${userId}`);
    const baseCharacter =
      await this.characterService.findOrCreateByUserId(userId); // Alap adatok: id, user_id, name, role

    const activeStoryProgress =
      await this.characterService.getActiveStoryProgress(baseCharacter.id);

    if (!activeStoryProgress) {
      this.logger.warn(
        `No active story progress found for character ${baseCharacter.id}. User should select a story.`,
      );
      // Olyan állapotot adunk vissza, amit a frontend Dashboardként tud értelmezni
      return {
        node: null,
        choices: [],
        character: this.mapCharacterToDto({
          // Minimális karakter adatok
          ...baseCharacter,
          health: 0,
          skill: 0,
          luck: 0,
          stamina: 0,
          defense: 0,
          level: 0,
          xp: 0,
          xp_to_next_level: 0,
          current_node_id: null,
          equipped_weapon_id: null,
          equipped_armor_id: null,
        } as Character), // Típus kényszerítés, mert a baseCharacter nem teljes
        combat: null,
        inventory: [],
        roundActions: null,
        equippedWeaponId: null,
        equippedArmorId: null,
      };
    }

    this.logger.debug(
      `Active story progress ID: ${activeStoryProgress.id}, Story ID: ${activeStoryProgress.story_id}, Current Node: ${activeStoryProgress.current_node_id}`,
    );

    // Karakter objektum összeállítása a sztori-specifikus adatokkal
    let characterForState: Character = {
      ...baseCharacter, // Globális adatok (id, user_id, name, role, created_at, updated_at)
      health: activeStoryProgress.health,
      skill: activeStoryProgress.skill,
      luck: activeStoryProgress.luck,
      stamina: activeStoryProgress.stamina,
      defense: activeStoryProgress.defense,
      level: activeStoryProgress.level,
      xp: activeStoryProgress.xp,
      xp_to_next_level: activeStoryProgress.xp_to_next_level,
      current_node_id: activeStoryProgress.current_node_id,
      equipped_weapon_id: activeStoryProgress.equipped_weapon_id,
      equipped_armor_id: activeStoryProgress.equipped_armor_id,
      talent_points_available: activeStoryProgress.talent_points_available,
    };
    characterForState =
      await this.characterService.applyPassiveEffects(characterForState); // Effektek alkalmazása

    // TODO: Inventory lekérdezése a character_story_inventory táblából, character_story_progress_id alapján.
    // Egyelőre a régi, character_id alapú lekérdezést használjuk.
    const inventory = await this.characterService.getStoryInventory(
      activeStoryProgress.id,
    );
    this.logger.debug(
      'Inventory fetched (using base character_id for now):',
      JSON.stringify(inventory),
    );

    // TODO: Active_combats táblának is character_story_progress_id-t kellene használnia.
    // Egyelőre a character_id-t használjuk.
    const activeCombatDbRecord = await this.knex('active_combats')
      .where({ character_id: baseCharacter.id })
      .first();

    if (activeCombatDbRecord) {
      this.logger.log(
        `User ${userId} is in active combat (Combat ID: ${activeCombatDbRecord.id})`,
      );
      const enemyBaseData = await this.knex<EnemyRecord>('enemies')
        .where({ id: activeCombatDbRecord.enemy_id })
        .first();
      if (!enemyBaseData) {
        await this.knex('active_combats')
          .where({ id: activeCombatDbRecord.id })
          .del();
        throw new InternalServerErrorException(
          'Combat data corrupted, enemy not found during active combat check.',
        );
      }

      const enemyData: EnemyDataDto = {
        id: enemyBaseData.id,
        name: enemyBaseData.name,
        health: enemyBaseData.health,
        currentHealth: activeCombatDbRecord.enemy_current_health,
        skill: enemyBaseData.skill,
        isChargingSpecial:
          (activeCombatDbRecord.enemy_charge_turns_current ?? 0) > 0,
        currentChargeTurns: activeCombatDbRecord.enemy_charge_turns_current,
        maxChargeTurns: enemyBaseData.special_attack_charge_turns,
        specialAttackTelegraphText:
          (activeCombatDbRecord.enemy_charge_turns_current ?? 0) > 0
            ? enemyBaseData.special_attack_telegraph_text
            : null,
      };

      return {
        node: null,
        choices: [],
        character: this.mapCharacterToDto(characterForState),
        combat: enemyData,
        inventory: inventory,
        roundActions: null, // Általános állapotlekéréskor nincs specifikus kör akció
        equippedWeaponId: characterForState.equipped_weapon_id,
        equippedArmorId: characterForState.equipped_armor_id,
      };
    } else {
      // NINCS HARCBAN
      const currentNodeId = characterForState.current_node_id; // Ezt használjuk a sztori progresszióból
      if (!currentNodeId) {
        // Ennek nem szabadna előfordulnia, ha a startOrContinueStory helyesen beállítja a kezdő node-ot.
        this.logger.error(
          `Character ${baseCharacter.id} (ProgressID: ${activeStoryProgress.id}) has no current_node_id in active story! Defaulting to STARTING_NODE_ID.`,
        );
        // Dönthetünk úgy, hogy hibát dobunk, vagy egy default node-ra tesszük.
        // Most egy "limbo" állapotot adunk vissza, a frontendnek kell kezelnie.
        return {
          node: null,
          choices: [],
          character: this.mapCharacterToDto(characterForState),
          combat: null,
          inventory: inventory,
          roundActions: null,
          equippedWeaponId: characterForState.equipped_weapon_id,
          equippedArmorId: characterForState.equipped_armor_id,
          messages: [
            'Hiba: Nincs aktuális pozíció a sztoriban. Válassz sztorit a kezdőpanelen!',
          ], // Extra üzenet
        };
      }

      const currentNode = await this.knex<StoryNode>('story_nodes')
        .where({ id: currentNodeId })
        .first();
      if (!currentNode) {
        throw new NotFoundException(
          `Story node ${currentNodeId} not found for active story progress.`,
        );
      }

      const potentialChoices = await this.knex<ChoiceRecord>('choices').where({
        source_node_id: currentNodeId,
      });
      const availableChoices = await Promise.all(
        potentialChoices.map(async (choice) => ({
          id: choice.id,
          text: choice.text,
          isAvailable: await this.checkChoiceAvailability(
            choice,
            characterForState,
            activeStoryProgress.id, // <-- ÚJ PARAMÉTER: az activeStoryProgress.id
          ), // A sztori-specifikus karaktert adjuk át
        })),
      );

      return {
        node: {
          id: currentNode.id,
          text: currentNode.text,
          image: currentNode.image,
        },
        choices: availableChoices,
        character: this.mapCharacterToDto(characterForState),
        combat: null,
        inventory: inventory,
        roundActions: null,
        equippedWeaponId: characterForState.equipped_weapon_id,
        equippedArmorId: characterForState.equipped_armor_id,
      };
    }
  } // getCurrentGameState vége

  // --- checkChoiceAvailability ---
  private async checkChoiceAvailability(
    choice: ChoiceRecord,
    character: Character, // Ez a sztori-specifikus, effektekkel ellátott statokat tartalmazza
    storyProgressId: number, // <-- ÚJ PARAMÉTER: az activeStoryProgress.id
  ): Promise<boolean> {
    this.logger.debug(
      `[GameService.checkChoiceAvailability] Checking choice ID ${choice.id} for character ID ${storyProgressId}`,
    );

    // 1. Tárgyköltség Ellenőrzése (a karakter sztori-specifikus leltárából)
    if (choice.item_cost_id) {
      // TODO: Ezt át kell írni this.characterService.hasStoryItem(activeStoryProgress.id, choice.item_cost_id)-re
      //       miután a CharacterService fel lett készítve a sztorinkénti leltárra.
      //       Egyelőre a régi, globális hasItem-et használjuk baseCharacter.id-val,
      //       de a 'character' paraméter már a sztori-specifikus statokat tartalmazza.
      const hasCostItem = await this.characterService.hasStoryItem(
        storyProgressId,
        choice.item_cost_id,
      ); // character.id itt a baseCharacter.id
      if (!hasCostItem) {
        this.logger.debug(
          `Choice ${choice.id} unavailable: Missing cost item ${choice.item_cost_id}`,
        );
        return false;
      }
    }

    // 2. Szükséges Tárgy Ellenőrzése (a karakter sztori-specifikus leltárából)
    if (choice.required_item_id) {
      // TODO: Ezt is át kell írni this.characterService.hasStoryItem(activeStoryProgress.id, choice.required_item_id)-re.
      const hasRequiredItem = await this.characterService.hasStoryItem(
        storyProgressId,
        choice.required_item_id,
      );
      if (!hasRequiredItem) {
        this.logger.debug(
          `Choice ${choice.id} unavailable: Missing required item ${choice.required_item_id}`,
        );
        return false;
      }
    }

    // 3. Statisztika Feltétel Ellenőrzése (a karakter sztori-specifikus, effektekkel ellátott statjai alapján)
    if (choice.required_stat_check) {
      const statRegex = /(\w+)\s*([<>=!]+)\s*(\d+)/;
      const match = choice.required_stat_check.match(statRegex);
      if (match) {
        const [, statName, operator, valueStr] = match;
        const requiredValue = parseInt(valueStr, 10);
        let characterStatValue = 0;

        switch (statName.toLowerCase()) {
          case 'skill':
            characterStatValue = character.skill ?? 0;
            break;
          case 'luck':
            characterStatValue = character.luck ?? 0;
            break;
          case 'stamina':
            characterStatValue = character.stamina ?? 0;
            break;
          case 'defense':
            characterStatValue = character.defense ?? 0;
            break;
          case 'level':
            characterStatValue = character.level ?? 0;
            break;
          case 'xp':
            characterStatValue = character.xp ?? 0;
            break;
          default:
            this.logger.warn(
              `Unknown stat '${statName}' in required_stat_check for choice ${choice.id}`,
            );
            return false; // Ismeretlen stat esetén ne legyen elérhető
        }

        let conditionMet = false;
        switch (operator) {
          case '>=':
            conditionMet = characterStatValue >= requiredValue;
            break;
          case '<=':
            conditionMet = characterStatValue <= requiredValue;
            break;
          case '>':
            conditionMet = characterStatValue > requiredValue;
            break;
          case '<':
            conditionMet = characterStatValue < requiredValue;
            break;
          case '==':
          case '=':
            conditionMet = characterStatValue === requiredValue;
            break;
          case '!=':
            conditionMet = characterStatValue !== requiredValue;
            break;
          default:
            this.logger.warn(
              `Unknown operator '${operator}' in required_stat_check for choice ${choice.id}`,
            );
            return false;
        }

        if (!conditionMet) {
          this.logger.debug(
            `Choice ${choice.id} unavailable: Stat check failed: ${characterStatValue} ${operator} ${requiredValue} (Stat: ${statName})`,
          );
          return false;
        }
      } else {
        this.logger.warn(
          `Could not parse required_stat_check: "${choice.required_stat_check}" for choice ${choice.id}`,
        );
        return false; // Hibás formátum esetén ne legyen elérhető
      }
    }
    this.logger.debug(`Choice ID ${choice.id} is available.`);
    return true; // Ha minden feltétel teljesült (vagy nem volt feltétel)
  } // checkChoiceAvailability vége

  async makeChoice(userId: number, choiceId: number): Promise<GameStateDto> {
    this.logger.log(
      `[GameService.makeChoice] UserID: ${userId}, Attempting ChoiceID: ${choiceId}`,
    );

    const baseCharacter =
      await this.characterService.findOrCreateByUserId(userId);
    const activeStoryProgress =
      await this.characterService.getActiveStoryProgress(baseCharacter.id);

    if (!activeStoryProgress || activeStoryProgress.current_node_id === null) {
      this.logger.error(
        `[GameService.makeChoice] No active story or current node for CharacterID: ${baseCharacter.id}.`,
      );
      throw new BadRequestException(
        'No active game session or current node to make a choice from.',
      );
    }

    const currentNodeId = activeStoryProgress.current_node_id;
    const characterForValidation: Character =
      await this.characterService.applyPassiveEffects({
        ...baseCharacter,
        health: activeStoryProgress.health,
        skill: activeStoryProgress.skill,
        luck: activeStoryProgress.luck,
        stamina: activeStoryProgress.stamina,
        defense: activeStoryProgress.defense,
        level: activeStoryProgress.level,
        xp: activeStoryProgress.xp,
        xp_to_next_level: activeStoryProgress.xp_to_next_level,
        current_node_id: currentNodeId,
        equipped_weapon_id: activeStoryProgress.equipped_weapon_id,
        equipped_armor_id: activeStoryProgress.equipped_armor_id,
      });

    const currentNode = await this.knex<StoryNode>('story_nodes')
      .where({ id: currentNodeId })
      .first();
    if (!currentNode)
      throw new NotFoundException(`Current node ${currentNodeId} not found!`);

    const choice = await this.knex<ChoiceRecord>('choices')
      .where({ id: choiceId, source_node_id: currentNodeId })
      .first();
    if (!choice)
      throw new BadRequestException(
        `Invalid choice ID: ${choiceId} for node ${currentNodeId}`,
      );

    // --- Feltétel ellenőrzés ---
    if (
      !(await this.checkChoiceAvailability(
        choice,
        characterForValidation,
        activeStoryProgress.id,
      ))
    ) {
      throw new ForbiddenException(
        'You do not meet the requirements for this choice.',
      );
    }

    // --- Tárgyköltség levonása a story inventoryból ---
    if (choice.item_cost_id !== null && choice.item_cost_id !== undefined) {
      this.logger.log(
        `Choice ${choiceId} (StoryProgressID: ${activeStoryProgress.id}) has item cost: ${choice.item_cost_id}. Attempting to remove from story inventory.`,
      );
      const removed = await this.characterService.removeStoryItem(
        activeStoryProgress.id,
        choice.item_cost_id,
        1,
      );
      if (!removed) {
        this.logger.error(
          `Failed to remove cost item ${choice.item_cost_id} for choice ${choiceId} (StoryProgressID: ${activeStoryProgress.id}).`,
        );
        throw new InternalServerErrorException('Failed to process item cost.');
      }
      this.logger.log(
        `Item ${choice.item_cost_id} successfully removed as cost for StoryProgressID: ${activeStoryProgress.id}.`,
      );
    }

    const targetNodeId = choice.target_node_id;
    const targetNode = await this.knex<StoryNode>('story_nodes')
      .where({ id: targetNodeId })
      .first();
    if (!targetNode)
      throw new InternalServerErrorException(
        `Target node ${targetNodeId} missing for choice ${choiceId}.`,
      );

    // --- Effekt/Jutalom alkalmazása a jelenlegi node alapján ---
    let newHealthForProgress = characterForValidation.health;
    if (
      currentNode.health_effect !== null &&
      currentNode.health_effect !== undefined
    ) {
      newHealthForProgress = Math.max(
        0,
        characterForValidation.health + currentNode.health_effect,
      );
    }

    if (
      currentNode.item_reward_id !== null &&
      currentNode.item_reward_id !== undefined
    ) {
      this.logger.log(
        `Node ${currentNodeId} grants item reward ID: ${currentNode.item_reward_id} to StoryProgressID: ${activeStoryProgress.id}`,
      );
      await this.characterService.addStoryItem(
        activeStoryProgress.id,
        currentNode.item_reward_id,
        1,
      );
      this.logger.log(
        `Item ${currentNode.item_reward_id} added to story inventory for StoryProgressID: ${activeStoryProgress.id}.`,
      );
    }

    const progressUpdates: Partial<CharacterStoryProgressRecord> = {
      health: newHealthForProgress,
    };

    // --- Döntés végrehajtása: Harc vagy új node ---
    if (targetNode.enemy_id) {
      this.logger.log(
        `Choice leads to combat at node ${targetNodeId} (StoryProgressID: ${activeStoryProgress.id})`,
      );

      const enemy = await this.knex<EnemyRecord>('enemies')
        .where({ id: targetNode.enemy_id })
        .first();
      if (!enemy)
        throw new InternalServerErrorException(
          `Enemy ${targetNode.enemy_id} not found.`,
        );

      await this.knex('active_combats').insert({
        character_id: baseCharacter.id, // FIGYELEM: később lecserélendő character_story_progress_id-ra
        enemy_id: enemy.id,
        enemy_current_health: enemy.health,
      });

      await this.knex('player_progress').insert({
        character_story_progress_id: activeStoryProgress.id,
        node_id: targetNodeId,
        choice_id_taken: choice.id,
      });
    } else {
      this.logger.log(
        `Choice leads to non-combat node ${targetNodeId} (StoryProgressID: ${activeStoryProgress.id})`,
      );
      progressUpdates.current_node_id = targetNodeId;

      await this.knex('player_progress').insert({
        character_story_progress_id: activeStoryProgress.id,
        node_id: targetNodeId,
        choice_id_taken: choice.id,
      });
    }

    // --- Story progress frissítése ---
    if (Object.keys(progressUpdates).length > 0) {
      this.logger.debug(
        `Updating story progress ${activeStoryProgress.id} with: ${JSON.stringify(progressUpdates)}`,
      );
      await this.characterService.updateStoryProgress(
        activeStoryProgress.id,
        progressUpdates,
      );
    }

    return this.getCurrentGameState(userId);
  }
  // makeChoice vége

  async useItemOutOfCombat(
    userId: number,
    itemId: number,
  ): Promise<CharacterStatsDto> {
    // Visszatérési típust is érdemes lehet GameStateDto-ra váltani a konzisztencia miatt
    this.logger.log(
      `Attempting to use item ${itemId} for user ${userId} outside of combat.`,
    );

    const baseCharacter =
      await this.characterService.findOrCreateByUserId(userId);
    const activeStoryProgress =
      await this.characterService.getActiveStoryProgress(baseCharacter.id);

    if (!activeStoryProgress) {
      this.logger.warn(
        `User ${userId} (Character ${baseCharacter.id}) has no active story progress to use item from.`,
      );
      throw new BadRequestException('No active story to use items in.');
    }
    const progressId = activeStoryProgress.id; // EZ A FONTOS ID A SZTORI-SPECIFIKUS MŰVELETEKHEZ

    // Ellenőrizzük, hogy nincs-e harcban (ez a logika maradhat a baseCharacter.id alapján,
    // mivel az active_combats még character_id-t használ)
    const existingCombat = await this.knex('active_combats')
      .where({ character_id: baseCharacter.id })
      .first();
    if (existingCombat) {
      throw new ForbiddenException(
        'Cannot use items this way while in combat.',
      );
    }

    // Van-e ilyen tárgya a sztori-specifikus leltárban?
    const hasItem = await this.characterService.hasStoryItem(
      progressId,
      itemId,
      1,
    ); // <--- JAVÍTVA: progressId használata
    if (!hasItem) {
      this.logger.warn(
        `User ${userId} (StoryProgress ${progressId}) tried to use item ${itemId} but doesn't have it.`,
      );
      throw new BadRequestException(
        'You do not have this item in your current story inventory.',
      );
    }

    const item = await this.knex<ItemRecord>('items')
      .where({ id: itemId })
      .first();
    if (!item)
      throw new InternalServerErrorException('Item data inconsistency.');
    if (!item.usable)
      throw new BadRequestException(`This item (${item.name}) cannot be used.`);

    let characterStatsUpdated = false;
    let newPlayerHealth = activeStoryProgress.health; // A sztori progresszió HP-jából indulunk

    if (item.effect && item.effect.startsWith('heal+')) {
      const healAmount = parseInt(item.effect.split('+')[1] ?? '0', 10);
      if (healAmount > 0) {
        const maxHp = activeStoryProgress.stamina ?? 100; // Max HP a progresszióból
        const previousPlayerHealth = newPlayerHealth;
        newPlayerHealth = Math.min(maxHp, newPlayerHealth + healAmount);

        if (newPlayerHealth > previousPlayerHealth) {
          this.logger.log(
            `Applying heal effect: ${healAmount} to StoryProgress ${progressId}. New health: ${newPlayerHealth}`,
          );
          // Sztori progresszió HP-jának frissítése
          await this.characterService.updateStoryProgress(progressId, {
            health: newPlayerHealth,
          }); // <--- JAVÍTVA

          // Tárgy eltávolítása a sztori-specifikus leltárból
          const removed = await this.characterService.removeStoryItem(
            progressId,
            itemId,
            1,
          ); // <--- JAVÍTVA
          if (!removed)
            this.logger.error(
              `Failed to remove item ${itemId} after use for StoryProgress ${progressId}!`,
            );
          characterStatsUpdated = true;
        } else {
          this.logger.log(
            `StoryProgress ${progressId} health already full, item ${itemId} not consumed.`,
          );
        }
      } else {
        this.logger.warn(`Item ${itemId} has zero or invalid heal amount.`);
      }
    } else {
      this.logger.warn(
        `Item ${itemId} has unhandled usable effect: ${item.effect}`,
      );
      throw new BadRequestException(
        `Cannot use this type of item (${item.name}) right now.`,
      );
    }

    // Frissített karakter adatok visszaadása (a teljes GameStateDto jobb lenne)
    // Ehhez újra le kellene kérni a "hidratált" karaktert az aktív progresszió alapján
    const finalHydratedCharacter =
      await this.characterService.getHydratedCharacterForStory(
        baseCharacter.id,
        progressId,
      ); // Feltételezve, hogy a _getHydratedCharacter public, vagy van egy publikus wrapperje
    if (!finalHydratedCharacter) {
      throw new InternalServerErrorException(
        'Character data not found after using item (for DTO).',
      );
    }
    return this.mapCharacterToDto(finalHydratedCharacter);

    // VAGY ha a Controller majd hívja a getCurrentGameState-et, akkor itt elég lehet egy void vagy boolean:
    // if (characterStatsUpdated) return; // Vagy return true;
    // throw new BadRequestException('Item had no effect.'); // Ha nem történt semmi
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

  async getPublishedStories(userId: number): Promise<PlayerStoryListItemDto[]> {
    this.logger.log(
      `Workspaceing published stories with progress for user ID: ${userId}`,
    );
    const character = await this.characterService.findOrCreateByUserId(userId);

    const stories = await this.knex('stories')
      .select(
        'stories.id as storyId',
        'stories.title',
        'stories.description',
        'csp.current_node_id as currentNodeIdInStory',
        'csp.last_played_at as lastPlayedAt',
        'csp.is_active as isActive',
      )
      // Arrow function használata a join callbackben, hogy a 'this.knex' elérhető legyen
      .leftJoin('character_story_progress as csp', (join) => {
        join
          .on('stories.id', '=', 'csp.story_id')
          .andOn('csp.character_id', '=', this.knex.raw('?', [character.id]));
      })
      .where('stories.is_published', true)
      .orderBy('stories.id', 'asc');

    return stories.map((s) => ({
      id: s.storyId,
      title: s.title,
      description: s.description,
      // Ha nincs progresszió (csp mezők null-ok), akkor azok null-ok maradnak a DTO-ban
      lastPlayedAt: s.lastPlayedAt ? new Date(s.lastPlayedAt) : null,
      currentNodeIdInStory: s.currentNodeIdInStory,
      isActive: s.isActive ?? false,
    }));
  }
} // GameService vége
