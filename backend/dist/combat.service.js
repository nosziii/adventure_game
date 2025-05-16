"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var CombatService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CombatService = void 0;
const common_1 = require("@nestjs/common");
const knex_1 = require("knex");
const database_module_1 = require("./database/database.module");
const character_service_1 = require("./character.service");
const VICTORY_NODE_ID = 8;
const DEFEAT_NODE_ID = 3;
let CombatService = CombatService_1 = class CombatService {
    knex;
    characterService;
    logger = new common_1.Logger(CombatService_1.name);
    constructor(knex, characterService) {
        this.knex = knex;
        this.characterService = characterService;
    }
    async _resolvePlayerAttack(character, enemyBaseData, currentEnemyHealth, activeCombatId) {
        const playerDice = Math.floor(Math.random() * 6) + 1;
        const enemyDice = Math.floor(Math.random() * 6) + 1;
        const playerSkill = character.skill ?? 0;
        const enemySkill = enemyBaseData.skill ?? 0;
        const playerAttackVal = playerSkill + playerDice;
        const enemyDefenseVal = enemySkill + enemyDice;
        const actionDetail = {
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
            let baseDamage = 1;
            if (character.equipped_weapon_id) {
                const weapon = await this.knex('items')
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
        }
        else {
            actionDetail.description = `Támadásod (${enemyBaseData.name} ellen) célt tévesztett! (Dobás: ${playerAttackVal} vs ${enemyDefenseVal})`;
        }
        return { actionDetail, updatedEnemyHealth };
    }
    async _resolvePlayerItemUse(characterInput, itemIdToUse) {
        let character = { ...characterInput };
        let playerActionTookTurn = true;
        let itemRemoved = false;
        const initialActionDetail = {
            actor: 'player',
            actionType: 'use_item',
            itemIdUsed: itemIdToUse,
        };
        const hasItem = await this.characterService.hasItem(character.id, itemIdToUse);
        if (!hasItem) {
            const actionDetail = {
                ...initialActionDetail,
                description: `Nincs ilyen tárgyad (ID: ${itemIdToUse})!`,
                outcome: 'item_use_failed',
            };
            return {
                actionDetail,
                updatedCharacter: character,
                itemRemoved,
                playerActionTookTurn,
            };
        }
        const item = await this.knex('items')
            .where({ id: itemIdToUse })
            .first();
        if (!item) {
            this.logger.error(`Item ${itemIdToUse} in inventory but not in items table!`);
            throw new common_1.InternalServerErrorException('Item data inconsistency during use_item.');
        }
        initialActionDetail.itemNameUsed = item.name;
        if (!item.usable) {
            const actionDetail = {
                ...initialActionDetail,
                description: `Ez a tárgy (${item.name}) nem használható így.`,
                outcome: 'item_use_failed',
            };
            return {
                actionDetail,
                updatedCharacter: character,
                itemRemoved,
                playerActionTookTurn,
            };
        }
        if (item.effect && item.effect.startsWith('heal+')) {
            const healAmount = parseInt(item.effect.split('+')[1] ?? '0', 10);
            if (healAmount > 0) {
                const maxHp = character.stamina ?? 100;
                const previousPlayerHealth = character.health;
                const newPlayerHealth = Math.min(maxHp, character.health + healAmount);
                const healedAmount = newPlayerHealth - previousPlayerHealth;
                if (healedAmount > 0) {
                    character = await this.characterService.updateCharacter(character.id, { health: newPlayerHealth });
                    itemRemoved = await this.characterService.removeItemFromInventory(character.id, itemIdToUse, 1);
                    if (!itemRemoved)
                        this.logger.error(`Failed to remove item ${itemIdToUse} after use!`);
                    const actionDetail = {
                        ...initialActionDetail,
                        description: `Gyógyító italt használtál (${item.name}). Visszatöltöttél ${healedAmount} életerőt! Jelenlegi HP: ${newPlayerHealth}.`,
                        outcome: 'item_used_successfully',
                        healthHealed: healedAmount,
                        targetActor: 'player',
                        targetCurrentHp: newPlayerHealth,
                        targetMaxHp: maxHp,
                    };
                    return {
                        actionDetail,
                        updatedCharacter: character,
                        itemRemoved: itemRemoved,
                        playerActionTookTurn,
                    };
                }
                else {
                    const actionDetail = {
                        ...initialActionDetail,
                        description: `Már maximum életerőn vagy (${item.name} használata nem szükséges).`,
                        outcome: 'no_effect',
                    };
                    playerActionTookTurn = false;
                    return {
                        actionDetail,
                        updatedCharacter: character,
                        itemRemoved,
                        playerActionTookTurn,
                    };
                }
            }
            else {
                const actionDetail = {
                    ...initialActionDetail,
                    description: `Ez a tárgy (${item.name}) nem fejt ki gyógyító hatást.`,
                    outcome: 'no_effect',
                };
                return {
                    actionDetail,
                    updatedCharacter: character,
                    itemRemoved,
                    playerActionTookTurn,
                };
            }
        }
        else {
            const actionDetail = {
                ...initialActionDetail,
                description: `Ezt a tárgyat (${item.name}) most nem tudod használni, vagy nincs implementálva a hatása.`,
                outcome: 'item_use_failed',
            };
            return {
                actionDetail,
                updatedCharacter: character,
                itemRemoved,
                playerActionTookTurn,
            };
        }
    }
    async _resolvePlayerDefend(activeCombatId) {
        this.logger.debug(`Player is defending for activeCombat ID: ${activeCombatId}`);
        await this.knex('active_combats')
            .where({ id: activeCombatId })
            .update({ character_is_defending: true, last_action_time: new Date() });
        const actionDetail = {
            actor: 'player',
            actionType: 'defend',
            description: 'Felkészülsz a védekezésre!',
            outcome: 'defended_effectively',
        };
        return { actionDetail, playerActionTookTurn: true };
    }
    async _resolveEnemyAction(characterInput, enemyBaseData, activeCombatState) {
        let character = { ...characterInput };
        const roundActions = [];
        let currentCharge = activeCombatState.enemy_charge_turns_current ?? 0;
        const characterIsDefending = activeCombatState.character_is_defending;
        const chargeTurnsRequired = enemyBaseData.special_attack_charge_turns ?? 0;
        this.logger.debug(`Enemy turn. Current charge: ${currentCharge}/${chargeTurnsRequired}. Player defending: ${characterIsDefending}`);
        if (enemyBaseData.special_attack_name &&
            chargeTurnsRequired > 0 &&
            currentCharge >= chargeTurnsRequired) {
            this.logger.debug(`Enemy ${enemyBaseData.id} is unleashing special attack: ${enemyBaseData.special_attack_name}`);
            const actionDetail = {
                actor: 'enemy',
                actionType: 'special_attack_execute',
                description: enemyBaseData.special_attack_execute_text ||
                    `${enemyBaseData.name} elsüti: ${enemyBaseData.special_attack_name}!`,
                outcome: 'miss',
            };
            const baseEnemyDmg = (enemyBaseData.skill ?? 0) * 0.5;
            let specialDamage = Math.floor(baseEnemyDmg * (enemyBaseData.special_attack_damage_multiplier ?? 1.5));
            if (characterIsDefending) {
                actionDetail.description += ` De te védekeztél, a sebzés jelentősen csökkent!`;
                specialDamage = Math.floor(specialDamage * 0.25);
            }
            else {
                specialDamage = Math.max(0, specialDamage - (character.defense ?? 0));
            }
            character.health = Math.max(0, character.health - specialDamage);
            actionDetail.outcome = 'hit';
            actionDetail.damageDealt = specialDamage;
            actionDetail.targetActor = 'player';
            actionDetail.targetCurrentHp = character.health;
            actionDetail.targetMaxHp = character.stamina ?? 100;
            roundActions.push(actionDetail);
            currentCharge = 0;
        }
        else if (enemyBaseData.special_attack_name &&
            chargeTurnsRequired > 0 &&
            currentCharge > 0) {
            this.logger.debug(`Enemy ${enemyBaseData.id} continues charging special attack.`);
            currentCharge++;
            roundActions.push({
                actor: 'enemy',
                actionType: 'special_attack_charge',
                description: enemyBaseData.special_attack_telegraph_text ||
                    `${enemyBaseData.name} tovább tölti a támadását... (${currentCharge}/${chargeTurnsRequired})`,
                outcome: 'charging_continues',
                currentChargeTurns: currentCharge,
                maxChargeTurns: chargeTurnsRequired,
            });
        }
        else if (enemyBaseData.special_attack_name &&
            chargeTurnsRequired > 0 &&
            Math.random() < 0.4) {
            this.logger.debug(`Enemy ${enemyBaseData.id} starts charging special attack.`);
            currentCharge = 1;
            roundActions.push({
                actor: 'enemy',
                actionType: 'special_attack_charge',
                description: enemyBaseData.special_attack_telegraph_text ||
                    `${enemyBaseData.name} erőt gyűjt!`,
                outcome: 'charging_began',
                currentChargeTurns: currentCharge,
                maxChargeTurns: chargeTurnsRequired,
            });
        }
        else {
            this.logger.debug(`Enemy ${enemyBaseData.id} performs a normal attack.`);
            const playerDiceDef = Math.floor(Math.random() * 6) + 1;
            const enemyDiceAtk = Math.floor(Math.random() * 6) + 1;
            const enemySkill = enemyBaseData.skill ?? 0;
            let playerEffectiveSkill = character.skill ?? 0;
            const normalAttackAction = {
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
                playerEffectiveSkill += character.skill ?? 0;
            }
            normalAttackAction.defenderRollDetails = {
                actorSkill: playerEffectiveSkill,
                diceRoll: playerDiceDef,
                totalValue: playerEffectiveSkill + playerDiceDef,
            };
            if (enemySkill + enemyDiceAtk > playerEffectiveSkill + playerDiceDef) {
                const baseEnemyDmg = 5;
                let actualDamageTaken = Math.max(0, baseEnemyDmg - (character.defense ?? 0));
                if (characterIsDefending) {
                    actualDamageTaken = Math.floor(actualDamageTaken / 2);
                    if (actualDamageTaken < baseEnemyDmg - (character.defense ?? 0) &&
                        actualDamageTaken >= 0)
                        normalAttackAction.description += ` A védekezésed csökkentette a sebzést!`;
                }
                character.health = Math.max(0, character.health - actualDamageTaken);
                normalAttackAction.outcome = 'hit';
                normalAttackAction.damageDealt = actualDamageTaken;
                normalAttackAction.targetActor = 'player';
                normalAttackAction.targetCurrentHp = character.health;
                normalAttackAction.targetMaxHp = character.stamina ?? 100;
                normalAttackAction.description += ` Eltalált! Sebzés: ${actualDamageTaken}. Életerőd: ${character.health}. (Dobás: ${enemySkill + enemyDiceAtk} vs ${playerEffectiveSkill + playerDiceDef})`;
            }
            else {
                normalAttackAction.description += ` Sikeresen kivédted ${enemyBaseData.name} támadását! (Dobás: ${enemySkill + enemyDiceAtk} vs ${playerEffectiveSkill + playerDiceDef})`;
            }
            roundActions.push(normalAttackAction);
        }
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
    async handleCombatAction(userId, actionDto) {
        this.logger.log(`Handling combat action '${actionDto.action}' for user ID: ${userId}`);
        let character = await this.characterService.findOrCreateByUserId(userId);
        let activeCombat = await this.knex('active_combats')
            .where({ character_id: character.id })
            .first();
        if (!activeCombat) {
            throw new common_1.ForbiddenException('You are not currently in combat.');
        }
        const enemyBaseData = await this.knex('enemies')
            .where({ id: activeCombat.enemy_id })
            .first();
        if (!enemyBaseData) {
            await this.knex('active_combats').where({ id: activeCombat.id }).del();
            throw new common_1.InternalServerErrorException('Combat data corrupted, enemy not found.');
        }
        let enemyCurrentHealth = activeCombat.enemy_current_health;
        const roundActions = [];
        let playerActionTookTurn = false;
        if (actionDto.action === 'attack') {
            const attackResult = await this._resolvePlayerAttack(character, enemyBaseData, enemyCurrentHealth, activeCombat.id);
            roundActions.push(attackResult.actionDetail);
            enemyCurrentHealth = attackResult.updatedEnemyHealth;
            playerActionTookTurn = true;
        }
        else if (actionDto.action === 'use_item' && actionDto.itemId) {
            const itemUseResult = await this._resolvePlayerItemUse(character, actionDto.itemId);
            roundActions.push(itemUseResult.actionDetail);
            character = itemUseResult.updatedCharacter;
            playerActionTookTurn = itemUseResult.playerActionTookTurn;
        }
        else if (actionDto.action === 'defend') {
            const defendResult = await this._resolvePlayerDefend(activeCombat.id);
            roundActions.push(defendResult.actionDetail);
            playerActionTookTurn = defendResult.playerActionTookTurn;
        }
        else {
            this.logger.error(`Unknown combat action received: ${actionDto.action}`);
            throw new common_1.BadRequestException('Invalid combat action.');
        }
        if (enemyCurrentHealth <= 0) {
            this.logger.log(`[VICTORY BLOCK] Entered. Enemy health is ${enemyCurrentHealth}.`);
            roundActions.push({
                actor: 'player',
                actionType: 'victory',
                outcome: 'victory',
                description: `Legyőzted: ${enemyBaseData.name}! ${enemyBaseData.defeat_text ?? ''}`,
            });
            this.logger.log(`Enemy ${enemyBaseData.id} defeated by character ${character.id}`);
            try {
                this.logger.debug(`[VICTORY BLOCK] Attempting to delete active_combats record ID: ${activeCombat.id}`);
                await this.knex('active_combats').where({ id: activeCombat.id }).del();
                this.logger.log(`[VICTORY BLOCK] Active combat record ${activeCombat.id} deleted.`);
                if (enemyBaseData.xp_reward > 0) {
                    this.logger.debug(`[VICTORY BLOCK] Attempting to add XP: ${enemyBaseData.xp_reward}`);
                    const xpResult = await this.characterService.addXp(character.id, enemyBaseData.xp_reward);
                    roundActions.push({
                        actor: 'player',
                        actionType: 'info',
                        outcome: 'info',
                        description: `Kaptál ${enemyBaseData.xp_reward} tapasztalati pontot.`,
                    });
                    if (xpResult.leveledUp)
                        xpResult.messages.forEach((m) => roundActions.push({
                            actor: 'player',
                            actionType: 'info',
                            outcome: 'info',
                            description: m,
                        }));
                    character =
                        (await this.characterService.findById(character.id)) ?? character;
                    this.logger.debug(`[VICTORY BLOCK] XP awarded. Leveled up: ${xpResult.leveledUp}`);
                }
                if (enemyBaseData.item_drop_id) {
                    this.logger.debug(`[VICTORY BLOCK] Attempting to add item drop ID: ${enemyBaseData.item_drop_id}`);
                    await this.characterService.addItemToInventory(character.id, enemyBaseData.item_drop_id, 1);
                    const droppedItem = await this.knex('items')
                        .where({ id: enemyBaseData.item_drop_id })
                        .first();
                    roundActions.push({
                        actor: 'player',
                        actionType: 'info',
                        outcome: 'info',
                        description: `Az ellenfél eldobta: ${droppedItem?.name ?? `Tárgy ID: ${enemyBaseData.item_drop_id}`}`,
                    });
                    this.logger.log(`[VICTORY BLOCK] Item dropped: ${enemyBaseData.item_drop_id}`);
                }
                const victoryNodeId = VICTORY_NODE_ID;
                this.logger.debug(`[VICTORY BLOCK] Attempting to move character ${character.id} to victory node ${victoryNodeId}`);
                character = await this.characterService.updateCharacter(character.id, {
                    current_node_id: victoryNodeId,
                });
                this.logger.log(`[VICTORY BLOCK] Character moved to node ${victoryNodeId}.`);
                this.logger.log('[VICTORY BLOCK] Preparing to return final state (combat over).');
                return {
                    character,
                    roundActions,
                    isCombatOver: true,
                    nextNodeId: victoryNodeId,
                    enemy: undefined,
                };
            }
            catch (errorInVictoryBlock) {
                this.logger.error(`[VICTORY BLOCK] CRITICAL ERROR during victory processing: ${errorInVictoryBlock}`, errorInVictoryBlock.stack);
                throw new common_1.InternalServerErrorException(`Error processing victory: ${errorInVictoryBlock.message}`);
            }
        }
        if (playerActionTookTurn) {
            const currentCombatTurnState = await this.knex('active_combats')
                .where({ id: activeCombat.id })
                .first();
            if (!currentCombatTurnState)
                throw new common_1.InternalServerErrorException('Combat state lost before enemy turn!');
            const enemyTurnResult = await this._resolveEnemyAction(character, enemyBaseData, currentCombatTurnState);
            roundActions.push(...enemyTurnResult.actionDetails);
            character = enemyTurnResult.updatedCharacter;
            await this.knex('active_combats')
                .where({ id: currentCombatTurnState.id })
                .update({
                enemy_charge_turns_current: enemyTurnResult.newChargeTurns,
                character_is_defending: false,
            });
            if (character.health <= 0) {
                roundActions.push({
                    actor: 'player',
                    actionType: 'defeat',
                    outcome: 'defeat',
                    description: 'Leestél a lábadról... Vége a kalandnak.',
                });
                await this.knex('active_combats')
                    .where({ id: currentCombatTurnState.id })
                    .del();
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
        this.logger.log(`Combat continues for user ${userId}. Round actions: ${roundActions.length}`);
        const finalCharacterState = await this.characterService.findById(character.id);
        if (!finalCharacterState)
            throw new common_1.InternalServerErrorException('Character state lost before final return!');
        const finalActiveCombatState = await this.knex('active_combats')
            .where({ id: activeCombat.id })
            .first();
        let enemyDtoForReturn = undefined;
        if (finalActiveCombatState) {
            const currentCharge = finalActiveCombatState.enemy_charge_turns_current ?? 0;
            const maxCharge = enemyBaseData.special_attack_charge_turns ?? 0;
            enemyDtoForReturn = {
                id: enemyBaseData.id,
                name: enemyBaseData.name,
                health: enemyBaseData.health,
                currentHealth: finalActiveCombatState.enemy_current_health,
                skill: enemyBaseData.skill,
                isChargingSpecial: currentCharge > 0,
                currentChargeTurns: finalActiveCombatState.enemy_charge_turns_current,
                maxChargeTurns: maxCharge,
                specialAttackTelegraphText: (finalActiveCombatState.enemy_charge_turns_current ?? 0) > 0
                    ? enemyBaseData.special_attack_telegraph_text
                    : null,
            };
        }
        else {
            this.logger.warn('Combat should be over but finalActiveCombat is missing. Setting enemy DTO to undefined.');
        }
        return {
            character: finalCharacterState,
            enemy: enemyDtoForReturn,
            roundActions,
            isCombatOver: false,
        };
    }
};
exports.CombatService = CombatService;
exports.CombatService = CombatService = CombatService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(database_module_1.KNEX_CONNECTION)),
    __metadata("design:paramtypes", [Function, character_service_1.CharacterService])
], CombatService);
//# sourceMappingURL=combat.service.js.map