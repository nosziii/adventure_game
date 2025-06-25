// src/combat.service.ts
import {
  Injectable,
  Inject,
  Logger,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Knex } from 'knex';
import { KNEX_CONNECTION } from './database/database.module'; // Igazítsd az útvonalat
import { CharacterService, Character } from './character.service';
import { EnemyRecord } from './game/interfaces/enemy-record.interface'; // Igazítsd az útvonalat
import { CombatActionDto } from './game/dto/combat-action.dto'; // Igazítsd az útvonalat
import { GameStateDto, CharacterStatsDto, EnemyDataDto } from './game/dto'; // Ezek a DTO-k kellenek a válaszhoz
import { ItemRecord } from './game/interfaces/item-record.interface';
import { CharacterStoryProgressRecord } from './game/interfaces/character-story-progres-record.interface';
import {
  CombatActionDetailsDto,
  CombatActionRollDetailsDto,
} from './combat/dto/combat-action-details.dto';

import { AbilityRecord } from './game/interfaces/ability-record.interface';

// A harc kimenetelét leíró interfész
export interface CombatResult {
  character: Character; // Frissített karakter
  enemy?: EnemyDataDto; // Frissített ellenfél adatai, ha a harc folytatódik
  roundActions: CombatActionDetailsDto[];
  isCombatOver: boolean;
  nextNodeId?: number; // Csak akkor, ha a harc véget ért
  // A teljes GameStateDto-t a GameService fogja összeállítani ez alapján
}

const VICTORY_NODE_ID = 8; // TODO: Konfigurálható
const DEFEAT_NODE_ID = 3; // TODO: Konfigurálható

@Injectable()
export class CombatService {
  private readonly logger = new Logger(CombatService.name);

  constructor(
    @Inject(KNEX_CONNECTION) private readonly knex: Knex,
    private readonly characterService: CharacterService,
  ) {}

  // --- JÁTÉKOS TÁMADÁSÁNAK SEGÉDFÜGGVÉNYE ---
  private async _resolvePlayerAttack(
    character: Character, // Hidratált karakter
    enemyBaseData: EnemyRecord,
    currentEnemyHealth: number,
    activeCombatId: number,
  ): Promise<{
    actionDetail: CombatActionDetailsDto;
    updatedEnemyHealth: number;
  }> {
    const playerDice = Math.floor(Math.random() * 6) + 1;
    const enemyDice = Math.floor(Math.random() * 6) + 1;

    const playerSkill = character.skill ?? 0;
    const enemySkill = enemyBaseData.skill ?? 0;

    const playerAttackVal = playerSkill + playerDice;
    const enemyDefenseVal = enemySkill + enemyDice;

    const actionDetail: CombatActionDetailsDto = {
      actor: 'player',
      actionType: 'attack',
      outcome: 'miss',
      description: `Megtámadod (${enemyBaseData.name})! Dobás: ${playerAttackVal} vs ${enemyDefenseVal}.`,
      attackerRollDetails: {
        actorSkill: playerSkill,
        diceRoll: playerDice,
        totalValue: playerAttackVal,
      },
      defenderRollDetails: {
        actorSkill: enemySkill,
        diceRoll: enemyDice,
        totalValue: enemyDefenseVal,
      },
    };

    let updatedEnemyHealth = currentEnemyHealth;

    if (playerAttackVal > enemyDefenseVal) {
      let baseDamage = 1; // Alap sebzés (ököl)
      if (character.equipped_weapon_id) {
        const weapon = await this.knex<ItemRecord>('items')
          .where({ id: character.equipped_weapon_id })
          .first();

        if (weapon?.effect) {
          const effects = weapon.effect.split(';');
          for (const effectPart of effects) {
            const damageMatch = effectPart.trim().match(/damage\+(\d+)/);
            if (damageMatch?.[1]) {
              baseDamage = parseInt(damageMatch[1], 10);
              break;
            }
          }
        }
      }

      const skillBonus = Math.floor(playerSkill / 5);
      const totalDamage = baseDamage + skillBonus;

      updatedEnemyHealth = Math.max(0, currentEnemyHealth - totalDamage);

      await this.knex('active_combats').where({ id: activeCombatId }).update({
        enemy_current_health: updatedEnemyHealth,
        last_action_time: new Date(),
      });

      actionDetail.outcome = 'hit';
      actionDetail.damageDealt = totalDamage;
      actionDetail.targetActor = 'enemy';
      actionDetail.targetCurrentHp = updatedEnemyHealth;
      actionDetail.targetMaxHp = enemyBaseData.health;
      actionDetail.description = `Eltaláltad (${enemyBaseData.name})! Sebzés: ${totalDamage}. (Dobás: ${playerAttackVal} vs ${enemyDefenseVal}). Ellenfél HP: ${updatedEnemyHealth}/${enemyBaseData.health}`;
    } else {
      actionDetail.description = `Támadásod (${enemyBaseData.name} ellen) célt tévesztett! (Dobás: ${playerAttackVal} vs ${enemyDefenseVal})`;
    }

    return { actionDetail, updatedEnemyHealth };
  }

  private async _resolvePlayerItemUse(
    character: Character, // Hidratált karakter
    activeStoryProgressId: number,
    itemIdToUse: number,
  ): Promise<{
    actionDetail: CombatActionDetailsDto;
    characterStateChanged: boolean;
    playerActionTookTurn: boolean;
  }> {
    let playerActionTookTurn = true;
    let characterStateChanged = false;

    const initialActionDetail: Partial<CombatActionDetailsDto> = {
      actor: 'player',
      actionType: 'use_item',
      itemIdUsed: itemIdToUse,
    };

    const hasItem = await this.characterService.hasStoryItem(
      activeStoryProgressId,
      itemIdToUse,
    );
    if (!hasItem) {
      return {
        actionDetail: {
          ...initialActionDetail,
          description: `Nincs ilyen tárgyad (ID: ${itemIdToUse})!`,
          outcome: 'item_use_failed',
        } as CombatActionDetailsDto,
        characterStateChanged,
        playerActionTookTurn,
      };
    }

    const item = await this.knex<ItemRecord>('items')
      .where({ id: itemIdToUse })
      .first();

    if (!item) {
      this.logger.error(
        `Item ${itemIdToUse} in inventory but not in items table!`,
      );
      throw new InternalServerErrorException(
        'Item data inconsistency during use_item.',
      );
    }

    initialActionDetail.itemNameUsed = item.name;

    if (!item.usable) {
      return {
        actionDetail: {
          ...initialActionDetail,
          description: `Ez a tárgy (${item.name}) nem használható így.`,
          outcome: 'item_use_failed',
        } as CombatActionDetailsDto,
        characterStateChanged,
        playerActionTookTurn,
      };
    }

    if (item.effect?.startsWith('heal+')) {
      const healAmount = parseInt(item.effect.split('+')[1] ?? '0', 10);
      if (healAmount > 0) {
        const maxHp = character.stamina ?? 100;
        const currentHp = character.health;
        const newHp = Math.min(maxHp, currentHp + healAmount);
        const healedAmount = newHp - currentHp;

        if (healedAmount > 0) {
          await this.characterService.updateStoryProgress(
            activeStoryProgressId,
            { health: newHp },
          );
          characterStateChanged = true;

          const removed = await this.characterService.removeStoryItem(
            activeStoryProgressId,
            itemIdToUse,
            1,
          );
          if (!removed) {
            this.logger.error(
              `Failed to remove item ${itemIdToUse} after use!`,
            );
          }

          return {
            actionDetail: {
              ...initialActionDetail,
              description: `Gyógyító italt használtál (${item.name}). Visszatöltöttél ${healedAmount} életerőt! Jelenlegi HP: ${newHp}.`,
              outcome: 'item_used_successfully',
              healthHealed: healedAmount,
              targetActor: 'player',
              targetCurrentHp: newHp,
              targetMaxHp: maxHp,
            } as CombatActionDetailsDto,
            characterStateChanged,
            playerActionTookTurn,
          };
        } else {
          playerActionTookTurn = false; // semmi nem történt
          return {
            actionDetail: {
              ...initialActionDetail,
              description: `Már teljes életerőn vagy, (${item.name}) nem volt hatással rád.`,
              outcome: 'no_effect',
            } as CombatActionDetailsDto,
            characterStateChanged,
            playerActionTookTurn,
          };
        }
      } else {
        return {
          actionDetail: {
            ...initialActionDetail,
            description: `Ez a tárgy (${item.name}) nem fejt ki gyógyító hatást.`,
            outcome: 'no_effect',
          } as CombatActionDetailsDto,
          characterStateChanged,
          playerActionTookTurn,
        };
      }
    } else {
      // TODO: későbbi effectek
      return {
        actionDetail: {
          ...initialActionDetail,
          description: `Ezt a tárgyat (${item.name}) most nem tudod használni, vagy nincs implementálva a hatása.`,
          outcome: 'item_use_failed',
        } as CombatActionDetailsDto,
        characterStateChanged,
        playerActionTookTurn,
      };
    }
  }
  // _resolvePlayerItemUse vége

  // --- _resolvePlayerDefend ---
  private async _resolvePlayerDefend(
    activeCombatId: number, // Az active_combats tábla ID-ja
  ): Promise<{
    actionDetail: CombatActionDetailsDto;
    playerActionTookTurn: boolean;
  }> {
    this.logger.debug(
      `Player is defending for activeCombat ID: ${activeCombatId}`,
    );
    await this.knex('active_combats')
      .where({ id: activeCombatId })
      .update({ character_is_defending: true, last_action_time: new Date() });

    const actionDetail: CombatActionDetailsDto = {
      actor: 'player',
      actionType: 'defend',
      description: 'Felkészülsz a védekezésre!',
      outcome: 'defended_effectively',
    };
    return { actionDetail, playerActionTookTurn: true };
  } // _resolvePlayerDefend vége

  private async _resolveEnemyAction(
    characterInput: Character, // Ezt kapja bemenetként
    activeStoryProgressId: number, // Ezt használjuk a DB frissítéshez, ha kell
    enemyBaseData: EnemyRecord,
    activeCombatCurrentState: {
      // Ez a DB-ből frissen olvasott active_combats sor
      id: number;
      enemy_charge_turns_current: number;
      character_is_defending: boolean;
    },
  ): Promise<{
    actionDetails: CombatActionDetailsDto[]; // Visszaadott akciók (lehet több, pl. töltés + szöveg)
    updatedCharacter: Character; // A játékos karakterének frissített állapota
    updatedEnemyChargeTurns: number; // Az ellenfél töltési köreinek új értéke
  }> {
    let character = { ...characterInput }; // Munkamásolat a karakterről
    const roundActions: CombatActionDetailsDto[] = [];
    let currentCharge =
      activeCombatCurrentState.enemy_charge_turns_current ?? 0;
    const characterIsDefending =
      activeCombatCurrentState.character_is_defending;
    const chargeTurnsRequired = enemyBaseData.special_attack_charge_turns ?? 0;
    let enemyActionOccurred = false; // Jelzi, hogy az ellenfél csinált-e valami mást, mint normál támadás

    this.logger.debug(
      `[ResolveEnemyAction] Start. Enemy: ${enemyBaseData.name}, CurrentCharge: ${currentCharge}/${chargeTurnsRequired}, Player Defending: ${characterIsDefending}, Player HP: ${character.health}`,
    );

    // 1. Speciális támadás elsütése
    if (
      enemyBaseData.special_attack_name &&
      chargeTurnsRequired > 0 &&
      currentCharge >= chargeTurnsRequired
    ) {
      this.logger.debug(
        `Enemy ${enemyBaseData.id} UNLEASHING special: ${enemyBaseData.special_attack_name}`,
      );
      const actionDetail: CombatActionDetailsDto = {
        actor: 'enemy',
        actionType: 'special_attack_execute',
        description:
          enemyBaseData.special_attack_execute_text ||
          `${enemyBaseData.name} elsüti: ${enemyBaseData.special_attack_name}!`,
        outcome: 'miss', // Alapból
      };

      const baseEnemySkillForSpecial = enemyBaseData.skill ?? 0; // Vagy egyedi skill a spec támadáshoz
      // Itt most nem dobunk kockát a speciális támadáshoz, feltételezzük, hogy "mindig talál", de a védekezés számít
      // Vagy lehetne egy támadó dobás itt is.
      const enemySkill = enemyBaseData.skill ?? 0;
      // --- JAVÍTOTT SEBZÉS KÉPLET (skill-alapú, az extra 1.5 szorzó nélkül) ---
      let initialSpecialDamage = Math.floor(
        enemySkill *
          0.75 * // Például a skill 75%-a az alap, vagy lehet skill * 1.0, ha a multiplier maga a fő szorzó
          (enemyBaseData.special_attack_damage_multiplier ?? 1.0), // Ogre multiplier a seederből = 2.5
      );
      // Példa számítás:
      // Ha enemySkill = 12, és a special_attack_damage_multiplier = 2.5:
      // initialSpecialDamage = Math.floor((12 * 0.75) * 2.5) = Math.floor(9 * 2.5) = Math.floor(22.5) = 22
      // VAGY, ha a skillt vesszük alapnak, és a multiplier az egyetlen szorzó:
      // initialSpecialDamage = Math.floor(enemySkill * (enemyBaseData.special_attack_damage_multiplier ?? 1.0));
      // Ez 12 * 2.5 = 30 lenne. Ez talán egyszerűbb és logikusabb. Próbáljuk ezzel!

      initialSpecialDamage = Math.floor(
        enemySkill * (enemyBaseData.special_attack_damage_multiplier ?? 1.0), // Pl. 12 * 2.5 = 30
      );
      //-----------------------------------

      let finalAppliedDamage = initialSpecialDamage;

      if (characterIsDefending) {
        actionDetail.description += ` De te védekeztél, a sebzés jelentősen csökkent!`;
        finalAppliedDamage = Math.floor(initialSpecialDamage * 0.25); // 75% redukció
        this.logger.debug(
          `[ResolveEnemyAction] Player IS defending. Reduced special damage to: ${finalAppliedDamage}`,
        );
      } else {
        const playerPassiveDefense = character.defense ?? 0;
        finalAppliedDamage = Math.max(
          0,
          initialSpecialDamage - playerPassiveDefense,
        );
        this.logger.debug(
          `[ResolveEnemyAction] Player IS NOT actively defending. Damage after passive defense (${playerPassiveDefense}): ${finalAppliedDamage}`,
        );
      }

      character.health = Math.max(0, character.health - finalAppliedDamage);
      actionDetail.outcome = 'hit'; // Feltételezzük, hogy a spec. támadás mindig "talál", csak a sebzés változik
      actionDetail.damageDealt = finalAppliedDamage;
      actionDetail.targetActor = 'player';
      actionDetail.targetCurrentHp = character.health;
      actionDetail.targetMaxHp = character.stamina ?? 100;
      roundActions.push(actionDetail);

      currentCharge = 0; // Töltés resetelése
      enemyActionOccurred = true;
    }
    // 2. Töltés folytatása
    else if (
      enemyBaseData.special_attack_name &&
      chargeTurnsRequired > 0 &&
      currentCharge > 0 &&
      currentCharge < chargeTurnsRequired
    ) {
      this.logger.debug(`Enemy ${enemyBaseData.id} CONTINUES charging.`);
      currentCharge++;
      roundActions.push({
        actor: 'enemy',
        actionType: 'special_attack_charge',
        description:
          enemyBaseData.special_attack_telegraph_text ||
          `${enemyBaseData.name} tovább gyűjti az erejét... (${currentCharge}/${chargeTurnsRequired})`,
        outcome: 'charging_continues',
        currentChargeTurns: currentCharge,
        maxChargeTurns: chargeTurnsRequired,
      });
      enemyActionOccurred = true;
    }
    // 3. Esély töltés elkezdésére
    else if (
      enemyBaseData.special_attack_name &&
      chargeTurnsRequired > 0 &&
      currentCharge === 0 &&
      Math.random() < 0.4
    ) {
      // 40% esély, és még nem tölt
      this.logger.debug(`Enemy ${enemyBaseData.id} STARTS charging.`);
      currentCharge = 1;
      roundActions.push({
        actor: 'enemy',
        actionType: 'special_attack_charge',
        description:
          enemyBaseData.special_attack_telegraph_text ||
          `${enemyBaseData.name} erőt gyűjt! (${currentCharge}/${chargeTurnsRequired})`,
        outcome: 'charging_began',
        currentChargeTurns: currentCharge,
        maxChargeTurns: chargeTurnsRequired,
      });
      enemyActionOccurred = true;
    }

    // 4. Normál támadás (ha semmi más nem történt)
    if (!enemyActionOccurred) {
      this.logger.debug(`Enemy ${enemyBaseData.id} performs a NORMAL attack.`);
      const playerDiceDef = Math.floor(Math.random() * 6) + 1;
      const enemyDiceAtk = Math.floor(Math.random() * 6) + 1;
      const enemySkill = enemyBaseData.skill ?? 0;
      let playerEffectiveSkill = character.skill ?? 0;

      const normalAttackAction: CombatActionDetailsDto = {
        actor: 'enemy',
        actionType: 'attack',
        description: `${enemyBaseData.name} rád támad (${enemyBaseData.attack_description ?? ''}).`,
        attackerRollDetails: {
          actorSkill: enemySkill,
          diceRoll: enemyDiceAtk,
          totalValue: enemySkill + enemyDiceAtk,
        },
        outcome: 'miss',
      };

      let defenseDescriptionPart = '';
      if (characterIsDefending) {
        defenseDescriptionPart = ` Védekezel!`;
        playerEffectiveSkill += character.skill ?? 0; // Pl. dupla skill a kitéréshez
      }
      normalAttackAction.defenderRollDetails = {
        actorSkill: playerEffectiveSkill,
        diceRoll: playerDiceDef,
        totalValue: playerEffectiveSkill + playerDiceDef,
      };
      normalAttackAction.description +=
        defenseDescriptionPart +
        ` (Dobás: ${enemySkill + enemyDiceAtk} vs ${playerEffectiveSkill + playerDiceDef})`;

      if (enemySkill + enemyDiceAtk > playerEffectiveSkill + playerDiceDef) {
        const baseEnemyDmg = 5; // TODO: Enemy-specifikus alapsebzés
        let actualDamageTaken = Math.max(
          0,
          baseEnemyDmg - (character.defense ?? 0),
        );
        let damageReductionText = '';

        if (characterIsDefending) {
          const originalDamage = actualDamageTaken;
          actualDamageTaken = Math.floor(actualDamageTaken / 2);
          if (actualDamageTaken < originalDamage && actualDamageTaken >= 0) {
            // Csak akkor írjuk ki, ha tényleg csökkent
            damageReductionText = ` A védekezésed csökkentette a sebzést!`;
          }
        }

        character.health = Math.max(0, character.health - actualDamageTaken);

        normalAttackAction.outcome = 'hit';
        normalAttackAction.damageDealt = actualDamageTaken;
        normalAttackAction.targetActor = 'player';
        normalAttackAction.targetCurrentHp = character.health;
        normalAttackAction.targetMaxHp = character.stamina ?? 100;
        normalAttackAction.description += `${damageReductionText} Eltalált! Sebzés: ${actualDamageTaken}. Életerőd: ${character.health}.`;
      } else {
        normalAttackAction.description += ` Sikeresen kivédted a támadást!`;
      }
      roundActions.push(normalAttackAction);
    }

    // Karakter HP frissítése a DB-ben a sztori progresszión keresztül, ha változott
    if (character.health !== characterInput.health) {
      this.logger.debug(
        `Player HP changed. Updating story progress ${activeStoryProgressId}. New HP: ${character.health}`,
      );
      // A characterService.updateStoryProgress visszaadja a frissített progress rekordot,
      // amiből újra "hidratálhatnánk" a karaktert, ha szükséges lenne a legfrissebb DB állapot.
      // De itt a 'character' objektum már tartalmazza a helyes HP-t a visszatéréshez.
      await this.characterService.updateStoryProgress(activeStoryProgressId, {
        health: character.health,
      });
    }

    return {
      actionDetails: roundActions,
      updatedCharacter: character,
      updatedEnemyChargeTurns: currentCharge,
    };
  } // _resolveEnemyAction vége

  private async _getHydratedCharacter(
    baseCharacterId: number,
    progressId: number,
  ): Promise<Character> {
    const baseChar = await this.characterService.findById(baseCharacterId); // Csak user_id, name, role stb.
    const progress = await this.knex<CharacterStoryProgressRecord>(
      'character_story_progress',
    )
      .where({ id: progressId })
      .first();

    if (!baseChar || !progress) {
      throw new InternalServerErrorException(
        'Failed to hydrate character for combat.',
      );
    }

    let hydratedCharacter: Character = {
      ...baseChar,
      health: progress.health,
      skill: progress.skill,
      luck: progress.luck,
      stamina: progress.stamina,
      defense: progress.defense,
      level: progress.level,
      xp: progress.xp,
      xp_to_next_level: progress.xp_to_next_level,
      current_node_id: progress.current_node_id, // Fontos a kontextushoz
      equipped_weapon_id: progress.equipped_weapon_id,
      equipped_armor_id: progress.equipped_armor_id,
    };
    return this.characterService.applyPassiveEffects(hydratedCharacter);
  }

  async handleCombatAction(
    userId: number,
    actionDto: CombatActionDto,
  ): Promise<CombatResult> {
    this.logger.log(
      `[CombatService] Handling combat action '${actionDto.action}' for UserID: ${userId}`,
    );

    const baseCharacter =
      await this.characterService.findOrCreateByUserId(userId);
    const activeStoryProgress =
      await this.characterService.getActiveStoryProgress(baseCharacter.id);

    if (!activeStoryProgress) {
      throw new ForbiddenException('No active story progress for character.');
    }

    const activeCombat = await this.knex('active_combats')
      .where({ character_id: baseCharacter.id })
      .first();

    if (!activeCombat) {
      throw new ForbiddenException('You are not currently in combat.');
    }

    const enemyBaseData = await this.knex<EnemyRecord>('enemies')
      .where({ id: activeCombat.enemy_id })
      .first();

    if (!enemyBaseData) {
      await this.knex('active_combats').where({ id: activeCombat.id }).del();
      throw new InternalServerErrorException(
        'Combat data corrupted, enemy not found.',
      );
    }

    let characterForCombat = await this._getHydratedCharacter(
      baseCharacter.id,
      activeStoryProgress.id,
    );
    let enemyCurrentHealth = activeCombat.enemy_current_health;
    const roundActions: CombatActionDetailsDto[] = [];
    let playerActionTookTurn = false;

    // 1. Player Action
    if (actionDto.action === 'attack') {
      const result = await this._resolvePlayerAttack(
        characterForCombat,
        enemyBaseData,
        enemyCurrentHealth,
        activeCombat.id,
      );
      roundActions.push(result.actionDetail);
      enemyCurrentHealth = result.updatedEnemyHealth;
      playerActionTookTurn = true;
    } else if (actionDto.action === 'use_item' && actionDto.itemId) {
      const result = await this._resolvePlayerItemUse(
        characterForCombat,
        activeStoryProgress.id,
        actionDto.itemId,
      );
      roundActions.push(result.actionDetail);
      if (result.characterStateChanged) {
        characterForCombat = await this._getHydratedCharacter(
          baseCharacter.id,
          activeStoryProgress.id,
        );
      }
      playerActionTookTurn = result.playerActionTookTurn;
    } else if (actionDto.action === 'defend') {
      const result = await this._resolvePlayerDefend(activeCombat.id);
      roundActions.push(result.actionDetail);
      playerActionTookTurn = result.playerActionTookTurn;
    } else if (actionDto.action === 'use_ability' && actionDto.abilityId) {
      // <-- ÚJ ÁG
      const result = await this._resolvePlayerAbilityUse(
        characterForCombat,
        enemyBaseData,
        activeStoryProgress.id,
        activeCombat.id,
        actionDto.abilityId,
        enemyCurrentHealth,
      );
      roundActions.push(result.actionDetail);
      enemyCurrentHealth = result.updatedEnemyHealth;
      characterForCombat = result.updatedCharacter;
      playerActionTookTurn = true;
    } else {
      this.logger.error(`Unknown combat action received: ${actionDto.action}`);
      throw new BadRequestException('Invalid combat action.');
    }

    // 2. Victory
    if (enemyCurrentHealth <= 0) {
      this.logger.log(
        `[VICTORY BLOCK] Entered. Enemy health is ${enemyCurrentHealth}.`,
      );
      roundActions.push({
        actor: 'player',
        actionType: 'victory',
        outcome: 'victory',
        description: `Legyőzted: ${enemyBaseData.name}! ${enemyBaseData.defeat_text ?? ''}`,
      });

      try {
        this.logger.debug(
          `[VICTORY BLOCK] Deleting active combat ID: ${activeCombat.id}`,
        );
        await this.knex('active_combats').where({ id: activeCombat.id }).del();

        let finalCharacterState = characterForCombat;

        if (enemyBaseData.xp_reward > 0) {
          const xpResult = await this.characterService.addXp(
            baseCharacter.id,
            enemyBaseData.xp_reward,
          );
          roundActions.push({
            actor: 'player',
            actionType: 'info',
            outcome: 'info',
            description: `Kaptál ${enemyBaseData.xp_reward} tapasztalati pontot.`,
          });
          if (xpResult.leveledUp) {
            xpResult.messages.forEach((msg) =>
              roundActions.push({
                actor: 'player',
                actionType: 'info',
                outcome: 'info',
                description: msg,
              }),
            );
          }
          finalCharacterState = await this._getHydratedCharacter(
            baseCharacter.id,
            activeStoryProgress.id,
          );
        }

        if (enemyBaseData.item_drop_id) {
          await this.characterService.addStoryItem(
            activeStoryProgress.id,
            enemyBaseData.item_drop_id,
            1,
          );
          const droppedItem = await this.knex('items')
            .where({ id: enemyBaseData.item_drop_id })
            .first();
          roundActions.push({
            actor: 'player',
            actionType: 'info',
            outcome: 'info',
            description: `Az ellenfél eldobta: ${droppedItem?.name ?? `Tárgy ID: ${enemyBaseData.item_drop_id}`}`,
          });
        }

        const updatedProgress = await this.characterService.updateStoryProgress(
          activeStoryProgress.id,
          {
            current_node_id: VICTORY_NODE_ID,
          },
        );
        finalCharacterState.current_node_id = updatedProgress.current_node_id;

        return {
          character: finalCharacterState,
          roundActions,
          isCombatOver: true,
          nextNodeId: VICTORY_NODE_ID,
          enemy: undefined,
        };
      } catch (e) {
        this.logger.error(
          `[VICTORY BLOCK] CRITICAL ERROR during victory processing: ${e}`,
          e.stack,
        );
        throw new InternalServerErrorException(
          `Error processing victory: ${e.message}`,
        );
      }
    }

    // 3. Enemy Turn
    if (playerActionTookTurn) {
      const currentCombat = await this.knex('active_combats')
        .where({ id: activeCombat.id })
        .first();
      if (!currentCombat) {
        throw new InternalServerErrorException(
          'Combat state lost during enemy turn.',
        );
      }

      const enemyTurnResult = await this._resolveEnemyAction(
        characterForCombat,
        activeStoryProgress.id,
        enemyBaseData,
        currentCombat,
      );
      roundActions.push(...enemyTurnResult.actionDetails);
      characterForCombat = enemyTurnResult.updatedCharacter;

      await this.knex('active_combats').where({ id: currentCombat.id }).update({
        enemy_charge_turns_current: enemyTurnResult.updatedEnemyChargeTurns,
        character_is_defending: false,
      });

      if (characterForCombat.health <= 0) {
        roundActions.push({
          actor: 'player',
          actionType: 'defeat',
          outcome: 'defeat',
          description: 'Leestél a lábadról... Vége a kalandnak.',
        });

        await this.knex('active_combats').where({ id: currentCombat.id }).del();
        const updatedProgress = await this.characterService.updateStoryProgress(
          activeStoryProgress.id,
          {
            current_node_id: DEFEAT_NODE_ID,
            health: 0,
          },
        );

        characterForCombat.current_node_id = updatedProgress.current_node_id;
        characterForCombat.health = 0;

        return {
          character: characterForCombat,
          roundActions,
          isCombatOver: true,
          nextNodeId: DEFEAT_NODE_ID,
          enemy: undefined,
        };
      }
    }

    // 4. Combat continues
    this.logger.log(
      `Combat continues for UserID: ${userId}. Round actions: ${roundActions.length}`,
    );

    const finalCharacterState = await this._getHydratedCharacter(
      baseCharacter.id,
      activeStoryProgress.id,
    );
    const finalActiveCombatState = await this.knex('active_combats')
      .where({ id: activeCombat.id })
      .first();

    let enemyDtoForReturn: EnemyDataDto | undefined = undefined;
    if (finalActiveCombatState) {
      const currentCharge =
        finalActiveCombatState.enemy_charge_turns_current ?? 0;
      const maxCharge = enemyBaseData.special_attack_charge_turns ?? 0;

      enemyDtoForReturn = {
        id: enemyBaseData.id,
        name: enemyBaseData.name,
        health: enemyBaseData.health,
        currentHealth: finalActiveCombatState.enemy_current_health,
        skill: enemyBaseData.skill,
        isChargingSpecial: currentCharge > 0,
        currentChargeTurns: currentCharge,
        maxChargeTurns: maxCharge,
        specialAttackTelegraphText:
          currentCharge > 0
            ? enemyBaseData.special_attack_telegraph_text
            : null,
      };
    } else {
      this.logger.warn(
        'Combat should be over but finalActiveCombat is missing. Setting enemy DTO to undefined.',
      );
    }

    return {
      character: finalCharacterState,
      enemy: enemyDtoForReturn,
      roundActions,
      isCombatOver: false,
    };
  }
  private async _resolvePlayerAbilityUse(
    characterForCombat: Character,
    enemyBaseData: EnemyRecord,
    activeStoryProgressId: number,
    activeCombatId: number,
    abilityId: number,
    currentEnemyHealth: number,
  ): Promise<{
    actionDetail: CombatActionDetailsDto;
    updatedEnemyHealth: number;
    updatedCharacter: Character;
  }> {
    let character = { ...characterForCombat };
    let enemyHealth = currentEnemyHealth;

    const hasAbility = await this.characterService.hasLearnedAbility(
      activeStoryProgressId,
      abilityId,
    );
    if (!hasAbility) {
      throw new ForbiddenException('You have not learned this ability.');
    }

    const ability = await this.knex<AbilityRecord>('abilities')
      .where({ id: abilityId })
      .first();
    if (!ability || ability.type !== 'ACTIVE_COMBAT_ACTION') {
      throw new BadRequestException('This ability cannot be used in combat.');
    }

    const actionDetail: CombatActionDetailsDto = {
      actor: 'player',
      actionType: 'use_ability', // A 3. pont javításával ez már helyes
      description: `Használod: ${ability.name}!`,
      outcome: 'no_effect', // Alapértelmezett kimenet
    };

    if (ability.effect_string) {
      // Robusztusabb effectMap létrehozás
      const effects = ability.effect_string
        .split(';')
        .filter((e) => e.trim() !== '');
      const effectMap = new Map(
        effects.map((e) => {
          const parts = e.split(':');
          return [parts[0]?.trim(), parts[1]?.trim()];
        }),
      );

      if (effectMap.has('damage_multiplier')) {
        const multiplier = parseFloat(
          effectMap.get('damage_multiplier') ?? '1.0',
        );

        // Fegyver alapsebzésének lekérdezése (az _resolvePlayerAttack-ból átemelve)
        let baseDamage = 1; // Alap ököl
        if (character.equipped_weapon_id) {
          const weapon = await this.knex<ItemRecord>('items')
            .where({ id: character.equipped_weapon_id })
            .first();
          if (weapon?.effect) {
            const weaponEffects = weapon.effect
              .split(';')
              .filter((e) => e.trim() !== '');
            for (const effectPart of weaponEffects) {
              const damageMatch = effectPart.trim().match(/damage\+(\d+)/);
              if (damageMatch?.[1]) {
                baseDamage = parseInt(damageMatch[1], 10);
                break;
              }
            }
          }
        }
        // --------------------------------------------------------------------------

        const skillBonus = Math.floor((character.skill ?? 0) / 5);
        const abilityDamage = Math.floor(
          (baseDamage + skillBonus) * multiplier,
        );

        enemyHealth = Math.max(0, enemyHealth - abilityDamage);

        actionDetail.outcome = 'ability_used_successfully';
        actionDetail.damageDealt = abilityDamage;
        actionDetail.targetActor = 'enemy';
        actionDetail.targetCurrentHp = enemyHealth;
        actionDetail.targetMaxHp = enemyBaseData.health;
        actionDetail.description += ` Sebzés: ${abilityDamage}. Az ellenfél új HP-ja: ${enemyHealth}.`;
      }

      // Ha van stamina költség
      if (effectMap.has('stamina_cost')) {
        const staminaCost = parseInt(effectMap.get('stamina_cost') ?? '0', 10);

        if ((character.stamina ?? 0) >= staminaCost) {
          const newStamina = (character.stamina ?? 0) - staminaCost;
          // ... (a többi sor)
        } else {
          throw new BadRequestException(
            'Nincs elég staminád a képesség használatához.',
          );
        }
      }
    }

    // DB frissítése az enemy HP-val
    await this.knex('active_combats').where({ id: activeCombatId }).update({
      enemy_current_health: enemyHealth,
      last_action_time: new Date(),
    });

    return {
      actionDetail,
      updatedEnemyHealth: enemyHealth,
      updatedCharacter: character,
    };
  }
}
