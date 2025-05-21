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
    async _resolvePlayerItemUse(character, activeStoryProgressId, itemIdToUse) {
        let playerActionTookTurn = true;
        let characterStateChanged = false;
        const initialActionDetail = {
            actor: 'player',
            actionType: 'use_item',
            itemIdUsed: itemIdToUse,
        };
        const hasItem = await this.characterService.hasStoryItem(activeStoryProgressId, itemIdToUse);
        if (!hasItem) {
            return {
                actionDetail: {
                    ...initialActionDetail,
                    description: `Nincs ilyen tárgyad (ID: ${itemIdToUse})!`,
                    outcome: 'item_use_failed',
                },
                characterStateChanged,
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
            return {
                actionDetail: {
                    ...initialActionDetail,
                    description: `Ez a tárgy (${item.name}) nem használható így.`,
                    outcome: 'item_use_failed',
                },
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
                    await this.characterService.updateStoryProgress(activeStoryProgressId, { health: newHp });
                    characterStateChanged = true;
                    const removed = await this.characterService.removeStoryItem(activeStoryProgressId, itemIdToUse, 1);
                    if (!removed) {
                        this.logger.error(`Failed to remove item ${itemIdToUse} after use!`);
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
                        },
                        characterStateChanged,
                        playerActionTookTurn,
                    };
                }
                else {
                    playerActionTookTurn = false;
                    return {
                        actionDetail: {
                            ...initialActionDetail,
                            description: `Már teljes életerőn vagy, (${item.name}) nem volt hatással rád.`,
                            outcome: 'no_effect',
                        },
                        characterStateChanged,
                        playerActionTookTurn,
                    };
                }
            }
            else {
                return {
                    actionDetail: {
                        ...initialActionDetail,
                        description: `Ez a tárgy (${item.name}) nem fejt ki gyógyító hatást.`,
                        outcome: 'no_effect',
                    },
                    characterStateChanged,
                    playerActionTookTurn,
                };
            }
        }
        else {
            return {
                actionDetail: {
                    ...initialActionDetail,
                    description: `Ezt a tárgyat (${item.name}) most nem tudod használni, vagy nincs implementálva a hatása.`,
                    outcome: 'item_use_failed',
                },
                characterStateChanged,
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
    async _resolveEnemyAction(characterInput, activeStoryProgressId, enemyBaseData, activeCombatCurrentState) {
        let character = { ...characterInput };
        const roundActions = [];
        let currentCharge = activeCombatCurrentState.enemy_charge_turns_current ?? 0;
        const characterIsDefending = activeCombatCurrentState.character_is_defending;
        const chargeTurnsRequired = enemyBaseData.special_attack_charge_turns ?? 0;
        let enemyActionOccurred = false;
        this.logger.debug(`[ResolveEnemyAction] Start. Enemy: ${enemyBaseData.name}, CurrentCharge: ${currentCharge}/${chargeTurnsRequired}, Player Defending: ${characterIsDefending}, Player HP: ${character.health}`);
        if (enemyBaseData.special_attack_name &&
            chargeTurnsRequired > 0 &&
            currentCharge >= chargeTurnsRequired) {
            this.logger.debug(`Enemy ${enemyBaseData.id} UNLEASHING special: ${enemyBaseData.special_attack_name}`);
            const actionDetail = {
                actor: 'enemy',
                actionType: 'special_attack_execute',
                description: enemyBaseData.special_attack_execute_text ||
                    `${enemyBaseData.name} elsüti: ${enemyBaseData.special_attack_name}!`,
                outcome: 'miss',
            };
            const baseEnemySkillForSpecial = enemyBaseData.skill ?? 0;
            const enemySkill = enemyBaseData.skill ?? 0;
            let initialSpecialDamage = Math.floor(enemySkill *
                0.75 *
                (enemyBaseData.special_attack_damage_multiplier ?? 1.0));
            initialSpecialDamage = Math.floor(enemySkill * (enemyBaseData.special_attack_damage_multiplier ?? 1.0));
            let finalAppliedDamage = initialSpecialDamage;
            if (characterIsDefending) {
                actionDetail.description += ` De te védekeztél, a sebzés jelentősen csökkent!`;
                finalAppliedDamage = Math.floor(initialSpecialDamage * 0.25);
                this.logger.debug(`[ResolveEnemyAction] Player IS defending. Reduced special damage to: ${finalAppliedDamage}`);
            }
            else {
                const playerPassiveDefense = character.defense ?? 0;
                finalAppliedDamage = Math.max(0, initialSpecialDamage - playerPassiveDefense);
                this.logger.debug(`[ResolveEnemyAction] Player IS NOT actively defending. Damage after passive defense (${playerPassiveDefense}): ${finalAppliedDamage}`);
            }
            character.health = Math.max(0, character.health - finalAppliedDamage);
            actionDetail.outcome = 'hit';
            actionDetail.damageDealt = finalAppliedDamage;
            actionDetail.targetActor = 'player';
            actionDetail.targetCurrentHp = character.health;
            actionDetail.targetMaxHp = character.stamina ?? 100;
            roundActions.push(actionDetail);
            currentCharge = 0;
            enemyActionOccurred = true;
        }
        else if (enemyBaseData.special_attack_name &&
            chargeTurnsRequired > 0 &&
            currentCharge > 0 &&
            currentCharge < chargeTurnsRequired) {
            this.logger.debug(`Enemy ${enemyBaseData.id} CONTINUES charging.`);
            currentCharge++;
            roundActions.push({
                actor: 'enemy',
                actionType: 'special_attack_charge',
                description: enemyBaseData.special_attack_telegraph_text ||
                    `${enemyBaseData.name} tovább gyűjti az erejét... (${currentCharge}/${chargeTurnsRequired})`,
                outcome: 'charging_continues',
                currentChargeTurns: currentCharge,
                maxChargeTurns: chargeTurnsRequired,
            });
            enemyActionOccurred = true;
        }
        else if (enemyBaseData.special_attack_name &&
            chargeTurnsRequired > 0 &&
            currentCharge === 0 &&
            Math.random() < 0.4) {
            this.logger.debug(`Enemy ${enemyBaseData.id} STARTS charging.`);
            currentCharge = 1;
            roundActions.push({
                actor: 'enemy',
                actionType: 'special_attack_charge',
                description: enemyBaseData.special_attack_telegraph_text ||
                    `${enemyBaseData.name} erőt gyűjt! (${currentCharge}/${chargeTurnsRequired})`,
                outcome: 'charging_began',
                currentChargeTurns: currentCharge,
                maxChargeTurns: chargeTurnsRequired,
            });
            enemyActionOccurred = true;
        }
        if (!enemyActionOccurred) {
            this.logger.debug(`Enemy ${enemyBaseData.id} performs a NORMAL attack.`);
            const playerDiceDef = Math.floor(Math.random() * 6) + 1;
            const enemyDiceAtk = Math.floor(Math.random() * 6) + 1;
            const enemySkill = enemyBaseData.skill ?? 0;
            let playerEffectiveSkill = character.skill ?? 0;
            const normalAttackAction = {
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
                playerEffectiveSkill += character.skill ?? 0;
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
                const baseEnemyDmg = 5;
                let actualDamageTaken = Math.max(0, baseEnemyDmg - (character.defense ?? 0));
                let damageReductionText = '';
                if (characterIsDefending) {
                    const originalDamage = actualDamageTaken;
                    actualDamageTaken = Math.floor(actualDamageTaken / 2);
                    if (actualDamageTaken < originalDamage && actualDamageTaken >= 0) {
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
            }
            else {
                normalAttackAction.description += ` Sikeresen kivédted a támadást!`;
            }
            roundActions.push(normalAttackAction);
        }
        if (character.health !== characterInput.health) {
            this.logger.debug(`Player HP changed. Updating story progress ${activeStoryProgressId}. New HP: ${character.health}`);
            await this.characterService.updateStoryProgress(activeStoryProgressId, {
                health: character.health,
            });
        }
        return {
            actionDetails: roundActions,
            updatedCharacter: character,
            updatedEnemyChargeTurns: currentCharge,
        };
    }
    async _getHydratedCharacter(baseCharacterId, progressId) {
        const baseChar = await this.characterService.findById(baseCharacterId);
        const progress = await this.knex('character_story_progress')
            .where({ id: progressId })
            .first();
        if (!baseChar || !progress) {
            throw new common_1.InternalServerErrorException('Failed to hydrate character for combat.');
        }
        let hydratedCharacter = {
            ...baseChar,
            health: progress.health,
            skill: progress.skill,
            luck: progress.luck,
            stamina: progress.stamina,
            defense: progress.defense,
            level: progress.level,
            xp: progress.xp,
            xp_to_next_level: progress.xp_to_next_level,
            current_node_id: progress.current_node_id,
            equipped_weapon_id: progress.equipped_weapon_id,
            equipped_armor_id: progress.equipped_armor_id,
        };
        return this.characterService.applyPassiveEffects(hydratedCharacter);
    }
    async handleCombatAction(userId, actionDto) {
        this.logger.log(`[CombatService] Handling combat action '${actionDto.action}' for UserID: ${userId}`);
        const baseCharacter = await this.characterService.findOrCreateByUserId(userId);
        const activeStoryProgress = await this.characterService.getActiveStoryProgress(baseCharacter.id);
        if (!activeStoryProgress) {
            throw new common_1.ForbiddenException('No active story progress for character.');
        }
        const activeCombat = await this.knex('active_combats')
            .where({ character_id: baseCharacter.id })
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
        let characterForCombat = await this._getHydratedCharacter(baseCharacter.id, activeStoryProgress.id);
        let enemyCurrentHealth = activeCombat.enemy_current_health;
        const roundActions = [];
        let playerActionTookTurn = false;
        if (actionDto.action === 'attack') {
            const result = await this._resolvePlayerAttack(characterForCombat, enemyBaseData, enemyCurrentHealth, activeCombat.id);
            roundActions.push(result.actionDetail);
            enemyCurrentHealth = result.updatedEnemyHealth;
            playerActionTookTurn = true;
        }
        else if (actionDto.action === 'use_item' && actionDto.itemId) {
            const result = await this._resolvePlayerItemUse(characterForCombat, activeStoryProgress.id, actionDto.itemId);
            roundActions.push(result.actionDetail);
            if (result.characterStateChanged) {
                characterForCombat = await this._getHydratedCharacter(baseCharacter.id, activeStoryProgress.id);
            }
            playerActionTookTurn = result.playerActionTookTurn;
        }
        else if (actionDto.action === 'defend') {
            const result = await this._resolvePlayerDefend(activeCombat.id);
            roundActions.push(result.actionDetail);
            playerActionTookTurn = result.playerActionTookTurn;
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
            try {
                this.logger.debug(`[VICTORY BLOCK] Deleting active combat ID: ${activeCombat.id}`);
                await this.knex('active_combats').where({ id: activeCombat.id }).del();
                let finalCharacterState = characterForCombat;
                if (enemyBaseData.xp_reward > 0) {
                    const xpResult = await this.characterService.addXp(baseCharacter.id, enemyBaseData.xp_reward);
                    roundActions.push({
                        actor: 'player',
                        actionType: 'info',
                        outcome: 'info',
                        description: `Kaptál ${enemyBaseData.xp_reward} tapasztalati pontot.`,
                    });
                    if (xpResult.leveledUp) {
                        xpResult.messages.forEach((msg) => roundActions.push({
                            actor: 'player',
                            actionType: 'info',
                            outcome: 'info',
                            description: msg,
                        }));
                    }
                    finalCharacterState = await this._getHydratedCharacter(baseCharacter.id, activeStoryProgress.id);
                }
                if (enemyBaseData.item_drop_id) {
                    await this.characterService.addStoryItem(activeStoryProgress.id, enemyBaseData.item_drop_id, 1);
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
                const updatedProgress = await this.characterService.updateStoryProgress(activeStoryProgress.id, {
                    current_node_id: VICTORY_NODE_ID,
                });
                finalCharacterState.current_node_id = updatedProgress.current_node_id;
                return {
                    character: finalCharacterState,
                    roundActions,
                    isCombatOver: true,
                    nextNodeId: VICTORY_NODE_ID,
                    enemy: undefined,
                };
            }
            catch (e) {
                this.logger.error(`[VICTORY BLOCK] CRITICAL ERROR during victory processing: ${e}`, e.stack);
                throw new common_1.InternalServerErrorException(`Error processing victory: ${e.message}`);
            }
        }
        if (playerActionTookTurn) {
            const currentCombat = await this.knex('active_combats')
                .where({ id: activeCombat.id })
                .first();
            if (!currentCombat) {
                throw new common_1.InternalServerErrorException('Combat state lost during enemy turn.');
            }
            const enemyTurnResult = await this._resolveEnemyAction(characterForCombat, activeStoryProgress.id, enemyBaseData, currentCombat);
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
                const updatedProgress = await this.characterService.updateStoryProgress(activeStoryProgress.id, {
                    current_node_id: DEFEAT_NODE_ID,
                    health: 0,
                });
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
        this.logger.log(`Combat continues for UserID: ${userId}. Round actions: ${roundActions.length}`);
        const finalCharacterState = await this._getHydratedCharacter(baseCharacter.id, activeStoryProgress.id);
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
                currentChargeTurns: currentCharge,
                maxChargeTurns: maxCharge,
                specialAttackTelegraphText: currentCharge > 0
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