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
import {
  CombatActionDetailsDto,
  CombatActionRollDetailsDto,
} from './combat/dto/combat-action-details.dto';

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
    character: Character,
    enemyBaseData: EnemyRecord,
    currentEnemyHealth: number, // Ezt a változót a segédfüggvény módosítja és adja vissza
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
      outcome: 'miss',
    };

    let updatedEnemyHealth = currentEnemyHealth;

    if (playerAttackVal > enemyDefenseVal) {
      let baseDamage = 1; // Alap ököl
      if (character.equipped_weapon_id) {
        const weapon = await this.knex<ItemRecord>('items')
          .where({ id: character.equipped_weapon_id })
          .first(); // ItemRecord típus
        if (weapon?.effect) {
          const effects = weapon.effect.split(';');
          for (const effectPart of effects) {
            const damageMatch = effectPart.trim().match(/damage\+(\d+)/);
            if (damageMatch?.[1]) {
              baseDamage = parseInt(damageMatch[1], 10);
              break; // Megvan a damage, kilépünk
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
    characterInput: Character,
    itemIdToUse: number,
    // enemyBaseData: EnemyRecord // Egyelőre nem használjuk, de később kellhet, ha item az enemyre hat
  ): Promise<{
    actionDetail: CombatActionDetailsDto;
    updatedCharacter: Character;
    itemRemoved: boolean;
    playerActionTookTurn: boolean;
  }> {
    let character = { ...characterInput }; // Munkamásolat
    let playerActionTookTurn = true; // Alapból a próbálkozás is egy akció
    let itemRemoved = false;

    const initialActionDetail: Partial<CombatActionDetailsDto> = {
      // Partial, mert az outcome és description változhat
      actor: 'player',
      actionType: 'use_item',
      itemIdUsed: itemIdToUse,
    };

    const hasItem = await this.characterService.hasItem(
      character.id,
      itemIdToUse,
    );
    if (!hasItem) {
      const actionDetail: CombatActionDetailsDto = {
        ...initialActionDetail,
        description: `Nincs ilyen tárgyad (ID: ${itemIdToUse})!`,
        outcome: 'item_use_failed',
      } as CombatActionDetailsDto; // Biztosítjuk a típust
      return {
        actionDetail,
        updatedCharacter: character,
        itemRemoved,
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
    initialActionDetail.itemNameUsed = item.name; // Tárgy neve

    if (!item.usable) {
      const actionDetail: CombatActionDetailsDto = {
        ...initialActionDetail,
        description: `Ez a tárgy (${item.name}) nem használható így.`,
        outcome: 'item_use_failed',
      } as CombatActionDetailsDto;
      return {
        actionDetail,
        updatedCharacter: character,
        itemRemoved,
        playerActionTookTurn,
      };
    }

    // Effektus feldolgozása (egyelőre csak 'heal+')
    if (item.effect && item.effect.startsWith('heal+')) {
      const healAmount = parseInt(item.effect.split('+')[1] ?? '0', 10);
      if (healAmount > 0) {
        const maxHp = character.stamina ?? 100; // TODO: Használj valós max HP-t
        const previousPlayerHealth = character.health;
        const newPlayerHealth = Math.min(maxHp, character.health + healAmount);
        const healedAmount = newPlayerHealth - previousPlayerHealth;

        if (healedAmount > 0) {
          character = await this.characterService.updateCharacter(
            character.id,
            { health: newPlayerHealth },
          );
          itemRemoved = await this.characterService.removeItemFromInventory(
            character.id,
            itemIdToUse,
            1,
          );
          if (!itemRemoved)
            this.logger.error(
              `Failed to remove item ${itemIdToUse} after use!`,
            );

          const actionDetail: CombatActionDetailsDto = {
            ...initialActionDetail,
            description: `Gyógyító italt használtál (${item.name}). Visszatöltöttél ${healedAmount} életerőt! Jelenlegi HP: ${newPlayerHealth}.`,
            outcome: 'item_used_successfully',
            healthHealed: healedAmount,
            targetActor: 'player',
            targetCurrentHp: newPlayerHealth,
            targetMaxHp: maxHp,
          } as CombatActionDetailsDto;
          return {
            actionDetail,
            updatedCharacter: character,
            itemRemoved: itemRemoved,
            playerActionTookTurn,
          };
        } else {
          const actionDetail: CombatActionDetailsDto = {
            ...initialActionDetail,
            description: `Már maximum életerőn vagy (${item.name} használata nem szükséges).`,
            outcome: 'no_effect',
          } as CombatActionDetailsDto;
          playerActionTookTurn = false; // Nem volt érdemi hatás
          return {
            actionDetail,
            updatedCharacter: character,
            itemRemoved,
            playerActionTookTurn,
          };
        }
      } else {
        // healAmount <= 0
        const actionDetail: CombatActionDetailsDto = {
          ...initialActionDetail,
          description: `Ez a tárgy (${item.name}) nem fejt ki gyógyító hatást.`,
          outcome: 'no_effect',
        } as CombatActionDetailsDto;
        return {
          actionDetail,
          updatedCharacter: character,
          itemRemoved,
          playerActionTookTurn,
        };
      }
    } else {
      // TODO: Más használható tárgyak effektjei
      const actionDetail: CombatActionDetailsDto = {
        ...initialActionDetail,
        description: `Ezt a tárgyat (${item.name}) most nem tudod használni, vagy nincs implementálva a hatása.`,
        outcome: 'item_use_failed',
      } as CombatActionDetailsDto;
      return {
        actionDetail,
        updatedCharacter: character,
        itemRemoved,
        playerActionTookTurn,
      };
    }
  } // _resolvePlayerItemUse vége

  // --- _resolvePlayerDefend ---
  private async _resolvePlayerDefend(activeCombatId: number): Promise<{
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
    characterInput: Character,
    enemyBaseData: EnemyRecord,
    activeCombatState: {
      id: number;
      enemy_charge_turns_current: number;
      character_is_defending: boolean;
    }, // Csak a szükséges adatok
  ): Promise<{
    actionDetails: CombatActionDetailsDto[];
    updatedCharacter: Character;
    newChargeTurns: number;
  }> {
    let character = { ...characterInput };
    const roundActions: CombatActionDetailsDto[] = [];
    let currentCharge = activeCombatState.enemy_charge_turns_current ?? 0;
    const characterIsDefending = activeCombatState.character_is_defending;
    const chargeTurnsRequired = enemyBaseData.special_attack_charge_turns ?? 0;

    this.logger.debug(
      `Enemy turn. Current charge: ${currentCharge}/${chargeTurnsRequired}. Player defending: ${characterIsDefending}`,
    );

    // 1. Speciális támadás elsütése, ha kész
    if (
      enemyBaseData.special_attack_name &&
      chargeTurnsRequired > 0 &&
      currentCharge >= chargeTurnsRequired
    ) {
      this.logger.debug(
        `Enemy ${enemyBaseData.id} is unleashing special attack: ${enemyBaseData.special_attack_name}`,
      );
      const actionDetail: CombatActionDetailsDto = {
        actor: 'enemy',
        actionType: 'special_attack_execute',
        description:
          enemyBaseData.special_attack_execute_text ||
          `${enemyBaseData.name} elsüti: ${enemyBaseData.special_attack_name}!`,
        outcome: 'miss', // Alapból
      };
      const baseEnemyDmg = (enemyBaseData.skill ?? 0) * 0.5; // Alap sebzés a skill fele (csak példa)
      let specialDamage = Math.floor(
        baseEnemyDmg * (enemyBaseData.special_attack_damage_multiplier ?? 1.5),
      );

      if (characterIsDefending) {
        actionDetail.description += ` De te védekeztél, a sebzés jelentősen csökkent!`;
        specialDamage = Math.floor(specialDamage * 0.25); // Pl. 75% redukció
      } else {
        specialDamage = Math.max(0, specialDamage - (character.defense ?? 0));
      }

      character.health = Math.max(0, character.health - specialDamage);
      actionDetail.outcome = 'hit'; // Feltételezzük, hogy a spec. támadás mindig talál, csak a sebzés változik
      actionDetail.damageDealt = specialDamage;
      actionDetail.targetActor = 'player';
      actionDetail.targetCurrentHp = character.health;
      actionDetail.targetMaxHp = character.stamina ?? 100;
      roundActions.push(actionDetail);
      currentCharge = 0; // Töltés resetelése
    }
    // 2. Töltés folytatása
    else if (
      enemyBaseData.special_attack_name &&
      chargeTurnsRequired > 0 &&
      currentCharge > 0
    ) {
      this.logger.debug(
        `Enemy ${enemyBaseData.id} continues charging special attack.`,
      );
      currentCharge++;
      roundActions.push({
        actor: 'enemy',
        actionType: 'special_attack_charge',
        description:
          enemyBaseData.special_attack_telegraph_text ||
          `${enemyBaseData.name} tovább tölti a támadását... (${currentCharge}/${chargeTurnsRequired})`,
        outcome: 'charging_continues',
        currentChargeTurns: currentCharge,
        maxChargeTurns: chargeTurnsRequired,
      });
    }
    // 3. Esély töltés elkezdésére
    else if (
      enemyBaseData.special_attack_name &&
      chargeTurnsRequired > 0 &&
      Math.random() < 0.4
    ) {
      // 40% esély
      this.logger.debug(
        `Enemy ${enemyBaseData.id} starts charging special attack.`,
      );
      currentCharge = 1;
      roundActions.push({
        actor: 'enemy',
        actionType: 'special_attack_charge',
        description:
          enemyBaseData.special_attack_telegraph_text ||
          `${enemyBaseData.name} erőt gyűjt!`,
        outcome: 'charging_began',
        currentChargeTurns: currentCharge,
        maxChargeTurns: chargeTurnsRequired,
      });
    }
    // 4. Normál támadás
    else {
      this.logger.debug(`Enemy ${enemyBaseData.id} performs a normal attack.`);
      const playerDiceDef = Math.floor(Math.random() * 6) + 1;
      const enemyDiceAtk = Math.floor(Math.random() * 6) + 1;
      const enemySkill = enemyBaseData.skill ?? 0;
      let playerEffectiveSkill = character.skill ?? 0;

      const normalAttackAction: CombatActionDetailsDto = {
        actor: 'enemy',
        actionType: 'attack',
        description: `${enemyBaseData.name} rád támad (${enemyBaseData.attack_description ?? ''})!`,
        attackerRollDetails: {
          actorSkill: enemySkill,
          diceRoll: enemyDiceAtk,
          totalValue: enemySkill + enemyDiceAtk,
        },
        outcome: 'miss',
      };

      if (characterIsDefending) {
        normalAttackAction.description = `${enemyBaseData.name} rád támad, de te védekezel!`;
        playerEffectiveSkill += character.skill ?? 0; // Dupla skill védekezésnél a kitéréshez
      }
      normalAttackAction.defenderRollDetails = {
        actorSkill: playerEffectiveSkill,
        diceRoll: playerDiceDef,
        totalValue: playerEffectiveSkill + playerDiceDef,
      };

      if (enemySkill + enemyDiceAtk > playerEffectiveSkill + playerDiceDef) {
        const baseEnemyDmg = 5; // Ellenfél normál alap sebzése
        let actualDamageTaken = Math.max(
          0,
          baseEnemyDmg - (character.defense ?? 0),
        );
        if (characterIsDefending) {
          actualDamageTaken = Math.floor(actualDamageTaken / 2);
          if (
            actualDamageTaken < baseEnemyDmg - (character.defense ?? 0) &&
            actualDamageTaken >= 0
          )
            normalAttackAction.description += ` A védekezésed csökkentette a sebzést!`;
        }
        character.health = Math.max(0, character.health - actualDamageTaken);

        normalAttackAction.outcome = 'hit';
        normalAttackAction.damageDealt = actualDamageTaken;
        normalAttackAction.targetActor = 'player';
        normalAttackAction.targetCurrentHp = character.health;
        normalAttackAction.targetMaxHp = character.stamina ?? 100;
        normalAttackAction.description += ` Eltalált! Sebzés: ${actualDamageTaken}. Életerőd: ${character.health}. (Dobás: ${enemySkill + enemyDiceAtk} vs ${playerEffectiveSkill + playerDiceDef})`;
      } else {
        normalAttackAction.description += ` Sikeresen kivédted ${enemyBaseData.name} támadását! (Dobás: ${enemySkill + enemyDiceAtk} vs ${playerEffectiveSkill + playerDiceDef})`;
      }
      roundActions.push(normalAttackAction);
    }

    // Karakter HP frissítése a DB-ben, ha változott
    if (character.health !== characterInput.health) {
      character = await this.characterService.updateCharacter(character.id, {
        health: character.health,
      });
    }

    return {
      actionDetails: roundActions,
      updatedCharacter: character,
      newChargeTurns: currentCharge,
    };
  }

  async handleCombatAction(
    userId: number,
    actionDto: CombatActionDto,
  ): Promise<CombatResult> {
    this.logger.log(
      `Handling combat action '${actionDto.action}' for user ID: ${userId}`,
    );
    let character = await this.characterService.findOrCreateByUserId(userId);
    let activeCombat = await this.knex('active_combats') // Legfrissebb activeCombat a kör elején
      .where({ character_id: character.id })
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

    let enemyCurrentHealth = activeCombat.enemy_current_health;
    const roundActions: CombatActionDetailsDto[] = [];
    let playerActionTookTurn = false;

    // 1. Játékos akciójának feldolgozása segédfüggvényekkel
    if (actionDto.action === 'attack') {
      const attackResult = await this._resolvePlayerAttack(
        character,
        enemyBaseData,
        enemyCurrentHealth,
        activeCombat.id,
      );
      roundActions.push(attackResult.actionDetail);
      enemyCurrentHealth = attackResult.updatedEnemyHealth;
      playerActionTookTurn = true;
    } else if (actionDto.action === 'use_item' && actionDto.itemId) {
      const itemUseResult = await this._resolvePlayerItemUse(
        character,
        actionDto.itemId,
      ); // enemyBaseData nem kell ide
      roundActions.push(itemUseResult.actionDetail);
      character = itemUseResult.updatedCharacter; // Fontos a karakter frissítése
      playerActionTookTurn = itemUseResult.playerActionTookTurn;
    } else if (actionDto.action === 'defend') {
      const defendResult = await this._resolvePlayerDefend(activeCombat.id);
      roundActions.push(defendResult.actionDetail);
      playerActionTookTurn = defendResult.playerActionTookTurn;
    } else {
      this.logger.error(`Unknown combat action received: ${actionDto.action}`);
      throw new BadRequestException('Invalid combat action.');
    }

    // 2. Győzelem ellenőrzése (játékos akciója után)
    if (enemyCurrentHealth <= 0) {
      this.logger.log(
        `[VICTORY BLOCK] Entered. Enemy health is ${enemyCurrentHealth}.`,
      ); // <--- ÚJ LOG

      roundActions.push({
        actor: 'player',
        actionType: 'victory',
        outcome: 'victory',
        description: `Legyőzted: ${enemyBaseData.name}! ${enemyBaseData.defeat_text ?? ''}`,
      });
      this.logger.log(
        `Enemy ${enemyBaseData.id} defeated by character ${character.id}`,
      );

      try {
        // Tegyünk egy try-catch blokkot ide a DB műveletek köré
        this.logger.debug(
          `[VICTORY BLOCK] Attempting to delete active_combats record ID: ${activeCombat.id}`,
        );
        await this.knex('active_combats').where({ id: activeCombat.id }).del();
        this.logger.log(
          `[VICTORY BLOCK] Active combat record ${activeCombat.id} deleted.`,
        );

        if (enemyBaseData.xp_reward > 0) {
          this.logger.debug(
            `[VICTORY BLOCK] Attempting to add XP: ${enemyBaseData.xp_reward}`,
          );
          const xpResult = await this.characterService.addXp(
            character.id,
            enemyBaseData.xp_reward,
          );
          roundActions.push({
            actor: 'player',
            actionType: 'info',
            outcome: 'info',
            description: `Kaptál ${enemyBaseData.xp_reward} tapasztalati pontot.`,
          });
          if (xpResult.leveledUp)
            xpResult.messages.forEach((m) =>
              roundActions.push({
                actor: 'player',
                actionType: 'info',
                outcome: 'info',
                description: m,
              }),
            );
          character =
            (await this.characterService.findById(character.id)) ?? character; // Frissítjük a karaktert az új XP/level adatokkal
          this.logger.debug(
            `[VICTORY BLOCK] XP awarded. Leveled up: ${xpResult.leveledUp}`,
          );
        }

        if (enemyBaseData.item_drop_id) {
          this.logger.debug(
            `[VICTORY BLOCK] Attempting to add item drop ID: ${enemyBaseData.item_drop_id}`,
          );
          await this.characterService.addItemToInventory(
            character.id,
            enemyBaseData.item_drop_id,
            1,
          );
          // Itt is frissíthetnénk a combat logot a tárgy nevével, ha lekérdezzük
          const droppedItem = await this.knex('items')
            .where({ id: enemyBaseData.item_drop_id })
            .first();
          roundActions.push({
            actor: 'player',
            actionType: 'info',
            outcome: 'info',
            description: `Az ellenfél eldobta: ${droppedItem?.name ?? `Tárgy ID: ${enemyBaseData.item_drop_id}`}`,
          });
          this.logger.log(
            `[VICTORY BLOCK] Item dropped: ${enemyBaseData.item_drop_id}`,
          );
        }

        const victoryNodeId = VICTORY_NODE_ID;
        this.logger.debug(
          `[VICTORY BLOCK] Attempting to move character ${character.id} to victory node ${victoryNodeId}`,
        );
        character = await this.characterService.updateCharacter(character.id, {
          current_node_id: victoryNodeId,
        });
        this.logger.log(
          `[VICTORY BLOCK] Character moved to node ${victoryNodeId}.`,
        );

        this.logger.log(
          '[VICTORY BLOCK] Preparing to return final state (combat over).',
        );
        return {
          character,
          roundActions,
          isCombatOver: true,
          nextNodeId: victoryNodeId,
          enemy: undefined,
        };
      } catch (errorInVictoryBlock) {
        this.logger.error(
          `[VICTORY BLOCK] CRITICAL ERROR during victory processing: ${errorInVictoryBlock}`,
          errorInVictoryBlock.stack,
        );
        // Hiba történt a győzelem feldolgozása közben. Mit tegyünk?
        // Lehet, hogy itt is egy default CombatResult-ot kellene visszaadni, ami jelzi a hibát,
        // de a harc állapotát próbáljuk meg rendben hagyni, amennyire lehet.
        // Vagy dobjunk tovább egy InternalServerErrorException-t.
        // Most dobjunk tovább, hogy lássuk a hibát.
        throw new InternalServerErrorException(
          `Error processing victory: ${errorInVictoryBlock.message}`,
        );
      }
    }

    // 3. Ellenfél akciója (ha még él és a játékos érdemi kört hajtott végre)
    if (playerActionTookTurn) {
      // Az enemyCurrentHealth > 0 már az előző if miatt biztos
      // Frissítjük az activeCombat-ot a legfrissebb character_is_defending flagért
      const currentCombatTurnState = await this.knex('active_combats')
        .where({ id: activeCombat!.id })
        .first();
      if (!currentCombatTurnState)
        throw new InternalServerErrorException(
          'Combat state lost before enemy turn!',
        );

      const enemyTurnResult = await this._resolveEnemyAction(
        character,
        enemyBaseData!,
        currentCombatTurnState,
      );
      roundActions.push(...enemyTurnResult.actionDetails); // Több esemény is lehet
      character = enemyTurnResult.updatedCharacter;

      // Frissítjük az active_combats táblát a töltéssel és a védekezés resetelésével
      await this.knex('active_combats')
        .where({ id: currentCombatTurnState.id })
        .update({
          enemy_charge_turns_current: enemyTurnResult.newChargeTurns,
          character_is_defending: false, // Védekezés mindig resetelődik az ellenfél köre után
        });

      // 4. Vereség ellenőrzése (játékos)
      if (character.health <= 0) {
        roundActions.push({
          actor: 'player',
          actionType: 'defeat',
          outcome: 'defeat',
          description: 'Leestél a lábadról... Vége a kalandnak.',
        });
        await this.knex('active_combats')
          .where({ id: currentCombatTurnState.id })
          .del(); // activeCombat.id helyett
        character = await this.characterService.updateCharacter(character.id, {
          current_node_id: DEFEAT_NODE_ID,
          health: 0,
        });
        return {
          character,
          roundActions,
          isCombatOver: true,
          nextNodeId: DEFEAT_NODE_ID,
          enemy: undefined,
        };
      }
    }

    // 5. Harc folytatódik: Állapot visszaadása
    this.logger.log(
      `Combat continues for user ${userId}. Round actions: ${roundActions.length}`,
    );
    const finalCharacterState = await this.characterService.findById(
      character.id,
    );
    if (!finalCharacterState)
      throw new InternalServerErrorException(
        'Character state lost before final return!',
      );

    const finalActiveCombatState = await this.knex('active_combats')
      .where({ id: activeCombat.id })
      .first();
    let enemyDtoForReturn: EnemyDataDto | undefined = undefined;

    if (finalActiveCombatState) {
      enemyDtoForReturn = {
        id: enemyBaseData.id,
        name: enemyBaseData.name,
        health: enemyBaseData.health, // Max HP
        currentHealth: finalActiveCombatState.enemy_current_health,
        skill: enemyBaseData.skill,
        isChargingSpecial:
          (finalActiveCombatState.enemy_charge_turns_current ?? 0) > 0 &&
          (finalActiveCombatState.enemy_charge_turns_current ?? 0) <
            (enemyBaseData.special_attack_charge_turns ?? Infinity),
        currentChargeTurns: finalActiveCombatState.enemy_charge_turns_current,
        maxChargeTurns: enemyBaseData.special_attack_charge_turns,
        specialAttackTelegraphText:
          (finalActiveCombatState.enemy_charge_turns_current ?? 0) > 0
            ? enemyBaseData.special_attack_telegraph_text
            : null,
      };
    } else {
      // Ha valamiért nincs finalActiveCombat (pl. a játékos győzött és töröltük),
      // de a kód valahogy idejutott, akkor ne küldjünk enemy adatot.
      // Ez az ág elvileg nem futhat le, ha a győzelem/vereség helyesen return-öl.
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
}
