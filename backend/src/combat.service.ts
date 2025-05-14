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

// A harc kimenetelét leíró interfész
export interface CombatResult {
  character: Character; // Frissített karakter
  enemy?: EnemyDataDto; // Frissített ellenfél adatai, ha a harc folytatódik
  combatLogMessages: string[];
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

  async handleCombatAction(
    userId: number,
    actionDto: CombatActionDto,
  ): Promise<CombatResult> {
    // Visszatérési típus: CombatResult
    this.logger.log(
      `Handling combat action '${actionDto.action}' for user ID: ${userId}`,
    );
    let character = await this.characterService.findOrCreateByUserId(userId);
    let activeCombat = await this.knex('active_combats')
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
    let playerCurrentHealth = character.health;
    const combatLogMessages: string[] = [];
    let playerActionSuccessful = false;

    // --- Játékos Akciója ---
    if (actionDto.action === 'attack') {
      combatLogMessages.push(`Megtámadod (${enemyBaseData.name})!`);
      const playerDice = Math.floor(Math.random() * 6) + 1;
      const enemyDice = Math.floor(Math.random() * 6) + 1;
      const playerAttackVal = (character.skill ?? 0) + playerDice;
      const enemyDefenseVal = (enemyBaseData.skill ?? 0) + enemyDice;

      if (playerAttackVal > enemyDefenseVal) {
        let baseDamage = 1; // Alap ököl
        if (character.equipped_weapon_id) {
          const weapon = await this.knex('items')
            .where({ id: character.equipped_weapon_id })
            .first();
          if (weapon?.effect) {
            const damageMatch = weapon.effect.match(/damage\+(\d+)/);
            if (damageMatch?.[1]) baseDamage = parseInt(damageMatch[1], 10);
          }
        }
        const skillBonus = Math.floor((character.skill ?? 0) / 5);
        const totalDamage = baseDamage + skillBonus;
        enemyCurrentHealth = Math.max(0, enemyCurrentHealth - totalDamage);
        combatLogMessages.push(
          `Eltaláltad! Sebzés: ${totalDamage}. Ellenfél HP: ${enemyCurrentHealth}/${enemyBaseData.health}`,
        );
        await this.knex('active_combats')
          .where({ id: activeCombat.id })
          .update({
            enemy_current_health: enemyCurrentHealth,
            last_action_time: new Date(),
          });
      } else {
        combatLogMessages.push(`Támadásod célt tévesztett!`);
      }
      playerActionSuccessful = true;
    } else if (actionDto.action === 'use_item') {
      // ... (Item use logic from previous correct version, updating playerCurrentHealth and character object) ...
      // ... (Make sure playerActionSuccessful is set to true if item use counts as a turn) ...
      const itemIdToUse = actionDto.itemId;
      if (!itemIdToUse) {
        throw new BadRequestException(
          'No itemId provided for use_item action.',
        );
      }
      combatLogMessages.push(
        `Megpróbálsz használni egy tárgyat (ID: ${itemIdToUse}).`,
      );
      const hasItem = await this.characterService.hasItem(
        character.id,
        itemIdToUse,
      );
      if (!hasItem) {
        combatLogMessages.push(`Nincs ilyen tárgyad!`);
      } else {
        const item = await this.knex('items')
          .where({ id: itemIdToUse })
          .first();
        if (!item) {
          throw new InternalServerErrorException('Item data inconsistency.');
        }
        if (!item.usable) {
          combatLogMessages.push(
            `Ez a tárgy (${item.name}) nem használható így.`,
          );
        } else if (item.effect && item.effect.startsWith('heal+')) {
          const healAmount = parseInt(item.effect.split('+')[1] ?? '0', 10);
          if (healAmount > 0) {
            const maxHp = character.stamina ?? 100;
            const previousPlayerHealth = playerCurrentHealth;
            playerCurrentHealth = Math.min(
              maxHp,
              playerCurrentHealth + healAmount,
            );
            const healedAmount = playerCurrentHealth - previousPlayerHealth;
            if (healedAmount > 0) {
              combatLogMessages.push(
                `Gyógyító italt használtál (${item.name})... HP: ${playerCurrentHealth}`,
              );
              character = await this.characterService.updateCharacter(
                character.id,
                { health: playerCurrentHealth },
              );
              // playerCurrentHealth = character.health; // Redundant after character is re-assigned
              await this.characterService.removeItemFromInventory(
                character.id,
                itemIdToUse,
                1,
              );
            } else {
              combatLogMessages.push(`Már maximum életerőn vagy.`);
            }
          } else {
            combatLogMessages.push(`Ez a tárgy (${item.name}) nem gyógyít.`);
          }
        } else {
          combatLogMessages.push(
            `Ezt a tárgyat (${item.name}) most nem tudod használni.`,
          );
        }
      }
      playerActionSuccessful = true; // Item use always counts as a turn
    } else if (actionDto.action === 'defend') {
      // --- ÚJ: Védekezés Akció ---
      combatLogMessages.push(`Felkészülsz a védekezésre!`);
      this.logger.debug(`Character ${character.id} chose to defend.`);
      // Beállítjuk az active_combats táblában, hogy védekezik
      await this.knex('active_combats')
        .where({ id: activeCombat.id })
        .update({ character_is_defending: true, last_action_time: new Date() });
      playerActionSuccessful = true; // A védekezés is egy akció
      // -------------------------
    } else {
      throw new BadRequestException('Invalid combat action.');
    }

    // --- Győzelem Ellenőrzése (Játékos akciója után) ---
    if (enemyCurrentHealth <= 0) {
      combatLogMessages.push(
        `Legyőzted: ${enemyBaseData.name}! ${enemyBaseData.defeat_text ?? ''}`,
      );
      this.logger.log(
        `Enemy ${enemyBaseData.id} defeated by character ${character.id}`,
      );
      await this.knex('active_combats').where({ id: activeCombat.id }).del();

      if (enemyBaseData.xp_reward > 0) {
        const xpResult = await this.characterService.addXp(
          character.id,
          enemyBaseData.xp_reward,
        );
        combatLogMessages.push(
          `Kaptál ${enemyBaseData.xp_reward} tapasztalati pontot.`,
        );
        if (xpResult.leveledUp) combatLogMessages.push(...xpResult.messages);
        // Frissítsük a karakter objektumot az XP/szintlépés után
        character =
          (await this.characterService.findById(character.id)) ?? character;
      }
      if (enemyBaseData.item_drop_id) {
        combatLogMessages.push(
          `Az ellenfél eldobott valamit! (Tárgy ID: ${enemyBaseData.item_drop_id})`,
        );
        await this.characterService.addItemToInventory(
          character.id,
          enemyBaseData.item_drop_id,
          1,
        );
      }
      character = await this.characterService.updateCharacter(character.id, {
        current_node_id: VICTORY_NODE_ID,
      });
      return {
        character,
        combatLogMessages,
        isCombatOver: true,
        nextNodeId: VICTORY_NODE_ID,
        enemy: undefined,
      }; // NEM getCurrentGameState
    }

    // --- Ellenfél Támadása (ha még él ÉS a játékos csinált valamit) ---
    let enemyPerformedSpecialAttackOrCharged = false;
    if (enemyCurrentHealth > 0 && playerActionSuccessful) {
      // Frissítsük az activeCombat állapotot, hogy a character_is_defending biztosan friss legyen
      activeCombat = await this.knex('active_combats')
        .where({ id: activeCombat.id })
        .first();
      if (!activeCombat)
        throw new InternalServerErrorException(
          'Combat state lost before enemy turn!',
        ); // Biztonsági ellenőrzés

      const characterIsDefending = activeCombat.character_is_defending;

      // 1. Speciális támadás végrehajtása, ha töltés befejeződött
      if (
        enemyBaseData.special_attack_name &&
        activeCombat.enemy_charge_turns_current >=
          (enemyBaseData.special_attack_charge_turns ?? 0)
      ) {
        enemyPerformedSpecialAttackOrCharged = true;
        combatLogMessages.push(
          enemyBaseData.special_attack_execute_text ||
            `${enemyBaseData.name} elsüti: ${enemyBaseData.special_attack_name}!`,
        );

        const baseEnemyDamage = 5; // Vagy vegyük az enemy alap sebzését, ha van ilyen oszlop
        let specialDamage = Math.floor(
          baseEnemyDamage *
            (enemyBaseData.special_attack_damage_multiplier ?? 1.0),
        );

        // Védekezés hatása a speciális támadásra (legyen hatékonyabb)
        if (characterIsDefending) {
          combatLogMessages.push(
            `De te védekeztél, így a sebzés jelentősen csökkent!`,
          );
          specialDamage = Math.floor(specialDamage * 0.25); // Pl. 75% sebzéscsökkentés
        } else {
          // Normál defense alkalmazása (ha a speciális támadás nem kerüli meg)
          specialDamage = Math.max(0, specialDamage - (character.defense ?? 0));
        }

        playerCurrentHealth = Math.max(0, playerCurrentHealth - specialDamage);
        combatLogMessages.push(
          `Eltalált a speciális támadással! Sebzés: ${specialDamage}. Életerőd: ${playerCurrentHealth}`,
        );
        character = await this.characterService.updateCharacter(character.id, {
          health: playerCurrentHealth,
        });

        // Töltés resetelése
        await this.knex('active_combats')
          .where({ id: activeCombat.id })
          .update({ enemy_charge_turns_current: 0 });
      }
      // 2. Speciális támadás töltésének növelése, ha folyamatban van (és még nem sütötte el)
      else if (
        enemyBaseData.special_attack_name &&
        activeCombat.enemy_charge_turns_current > 0
      ) {
        enemyPerformedSpecialAttackOrCharged = true;
        const newCharge = activeCombat.enemy_charge_turns_current + 1;
        await this.knex('active_combats')
          .where({ id: activeCombat.id })
          .update({ enemy_charge_turns_current: newCharge });
        combatLogMessages.push(
          enemyBaseData.special_attack_telegraph_text ||
            `${enemyBaseData.name} készül valamire...`,
        );
      }
      // 3. Esély speciális támadás töltésének elkezdésére (ha van speciális támadása és nem tölt éppen)
      else if (
        enemyBaseData.special_attack_name &&
        (enemyBaseData.special_attack_charge_turns ?? 0) > 0 &&
        Math.random() < 0.33
      ) {
        // 33% esély
        enemyPerformedSpecialAttackOrCharged = true;
        await this.knex('active_combats')
          .where({ id: activeCombat.id })
          .update({ enemy_charge_turns_current: 1 });
        combatLogMessages.push(
          enemyBaseData.special_attack_telegraph_text ||
            `${enemyBaseData.name} erőt gyűjt!`,
        );
      }
      // 4. Normál támadás (ha nem történt speciális támadás vagy töltés)
      else {
        combatLogMessages.push(
          `${enemyBaseData.name} rád támad (${enemyBaseData.attack_description ?? ''})!`,
        );
        // ... (Normál támadás logikája, playerEffectiveDefenseSkill számítása, sebzés, HP update) ...
        // ... (Itt is figyelembe kell venni a characterIsDefending-et a sebzés csökkentéséhez)
        const playerDiceDef = Math.floor(Math.random() * 6) + 1;
        const enemyDiceAtk = Math.floor(Math.random() * 6) + 1;
        const enemyAttackVal = (enemyBaseData.skill ?? 0) + enemyDiceAtk;
        let playerEffectiveDefenseSkill = character.skill ?? 0; // Alap skill
        // Ha a játékos védekezett ebben a körben
        if (characterIsDefending) {
          this.logger.debug(
            `Player is defending! Applying defense bonus to skill roll.`,
          );
          combatLogMessages.push(`Védekezel!`);
          playerEffectiveDefenseSkill += character.skill ?? 0; // Pl. dupla skill a kitéréshez
        }
        const playerDefenseVal = playerEffectiveDefenseSkill + playerDiceDef;

        if (enemyAttackVal > playerDefenseVal) {
          const baseEnemyDamage = 5;
          let actualDamageTaken = Math.max(
            0,
            baseEnemyDamage - (character.defense ?? 0),
          );
          if (characterIsDefending) {
            actualDamageTaken = Math.floor(actualDamageTaken / 2); // Felezett sebzés védekezéskor
            if (actualDamageTaken > 0)
              combatLogMessages.push(`A védekezésed csökkentette a sebzést!`);
          }
          playerCurrentHealth = Math.max(
            0,
            playerCurrentHealth - actualDamageTaken,
          );
          combatLogMessages.push(
            `Eltalált! Sebzés: ${actualDamageTaken}. Életerőd: ${playerCurrentHealth}`,
          );
          character = await this.characterService.updateCharacter(
            character.id,
            { health: playerCurrentHealth },
          );
        } else {
          combatLogMessages.push(
            `Sikeresen kivédted ${enemyBaseData.name} támadását!`,
          );
        }
      }

      // Védekezés flag visszaállítása a kör végén, ha be volt állítva
      if (characterIsDefending) {
        await this.knex('active_combats')
          .where({ id: activeCombat.id })
          .update({ character_is_defending: false });
      }

      // Vereség Ellenőrzése a játékoson
      if (playerCurrentHealth <= 0) {
        // ... (Vereség kezelése: log, active_combats törlés, karakter node és HP frissítés, return CombatResult) ...
        return {
          character,
          combatLogMessages,
          isCombatOver: true,
          nextNodeId: DEFEAT_NODE_ID,
          enemy: undefined,
        };
      }
    } // Ellenfél támadásának vége

    // --- Harc Folytatódik ---
    this.logger.log(`Combat continues for user ${userId}. Round finished.`);
    // Biztosítjuk, hogy a legfrissebb karakteradatokkal térjünk vissza
    const finalCharacterStateInRound = await this.characterService.findById(
      character.id,
    );
    if (!finalCharacterStateInRound)
      throw new InternalServerErrorException('Character state lost!');

    const finalActiveCombatState = await this.knex('active_combats')
      .where({ id: activeCombat.id })
      .first();

    const currentCombatEnemyData: EnemyDataDto = {
      id: enemyBaseData.id,
      name: enemyBaseData.name,
      health: enemyBaseData.health,
      currentHealth: enemyCurrentHealth,
      skill: enemyBaseData.skill,
      // Új mezők a DTO-ban a frontendnek:
      isChargingSpecial:
        (finalActiveCombatState?.enemy_charge_turns_current ?? 0) > 0 &&
        (finalActiveCombatState?.enemy_charge_turns_current ?? 0) <
          (enemyBaseData.special_attack_charge_turns ?? Infinity),
      currentChargeTurns: finalActiveCombatState?.enemy_charge_turns_current,
      maxChargeTurns: enemyBaseData.special_attack_charge_turns,
      specialAttackTelegraphText:
        (finalActiveCombatState?.enemy_charge_turns_current ?? 0) > 0
          ? enemyBaseData.special_attack_telegraph_text
          : null,
    };
    return {
      character: finalCharacterStateInRound,
      enemy: currentCombatEnemyData,
      combatLogMessages,
      isCombatOver: false,
    };
  }
}
