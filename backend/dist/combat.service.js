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
    async handleCombatAction(userId, actionDto) {
        this.logger.log(`Handling combat action '${actionDto.action}' for user ID: ${userId}`);
        let character = await this.characterService.findOrCreateByUserId(userId);
        const activeCombat = await this.knex('active_combats')
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
        let playerCurrentHealth = character.health;
        const combatLogMessages = [];
        let playerActionSuccessful = false;
        let playerIsDefending = false;
        if (actionDto.action === 'attack') {
            combatLogMessages.push(`Megtámadod (${enemyBaseData.name})!`);
            const playerDice = Math.floor(Math.random() * 6) + 1;
            const enemyDice = Math.floor(Math.random() * 6) + 1;
            const playerAttackVal = (character.skill ?? 0) + playerDice;
            const enemyDefenseVal = (enemyBaseData.skill ?? 0) + enemyDice;
            if (playerAttackVal > enemyDefenseVal) {
                let baseDamage = 1;
                if (character.equipped_weapon_id) {
                    const weapon = await this.knex('items')
                        .where({ id: character.equipped_weapon_id })
                        .first();
                    if (weapon?.effect) {
                        const damageMatch = weapon.effect.match(/damage\+(\d+)/);
                        if (damageMatch?.[1])
                            baseDamage = parseInt(damageMatch[1], 10);
                    }
                }
                const skillBonus = Math.floor((character.skill ?? 0) / 5);
                const totalDamage = baseDamage + skillBonus;
                enemyCurrentHealth = Math.max(0, enemyCurrentHealth - totalDamage);
                combatLogMessages.push(`Eltaláltad! Sebzés: ${totalDamage}. Ellenfél HP: ${enemyCurrentHealth}/${enemyBaseData.health}`);
                await this.knex('active_combats')
                    .where({ id: activeCombat.id })
                    .update({
                    enemy_current_health: enemyCurrentHealth,
                    last_action_time: new Date(),
                });
            }
            else {
                combatLogMessages.push(`Támadásod célt tévesztett!`);
            }
            playerActionSuccessful = true;
        }
        else if (actionDto.action === 'use_item') {
            const itemIdToUse = actionDto.itemId;
            if (!itemIdToUse) {
                throw new common_1.BadRequestException('No itemId provided for use_item action.');
            }
            combatLogMessages.push(`Megpróbálsz használni egy tárgyat (ID: ${itemIdToUse}).`);
            const hasItem = await this.characterService.hasItem(character.id, itemIdToUse);
            if (!hasItem) {
                combatLogMessages.push(`Nincs ilyen tárgyad!`);
            }
            else {
                const item = await this.knex('items')
                    .where({ id: itemIdToUse })
                    .first();
                if (!item) {
                    throw new common_1.InternalServerErrorException('Item data inconsistency.');
                }
                if (!item.usable) {
                    combatLogMessages.push(`Ez a tárgy (${item.name}) nem használható így.`);
                }
                else if (item.effect && item.effect.startsWith('heal+')) {
                    const healAmount = parseInt(item.effect.split('+')[1] ?? '0', 10);
                    if (healAmount > 0) {
                        const maxHp = character.stamina ?? 100;
                        const previousPlayerHealth = playerCurrentHealth;
                        playerCurrentHealth = Math.min(maxHp, playerCurrentHealth + healAmount);
                        const healedAmount = playerCurrentHealth - previousPlayerHealth;
                        if (healedAmount > 0) {
                            combatLogMessages.push(`Gyógyító italt használtál (${item.name})... HP: ${playerCurrentHealth}`);
                            character = await this.characterService.updateCharacter(character.id, { health: playerCurrentHealth });
                            await this.characterService.removeItemFromInventory(character.id, itemIdToUse, 1);
                        }
                        else {
                            combatLogMessages.push(`Már maximum életerőn vagy.`);
                        }
                    }
                    else {
                        combatLogMessages.push(`Ez a tárgy (${item.name}) nem gyógyít.`);
                    }
                }
                else {
                    combatLogMessages.push(`Ezt a tárgyat (${item.name}) most nem tudod használni.`);
                }
            }
            playerActionSuccessful = true;
        }
        else if (actionDto.action === 'defend') {
            combatLogMessages.push(`Felkészülsz a védekezésre!`);
            this.logger.debug(`Character ${character.id} chose to defend.`);
            await this.knex('active_combats')
                .where({ id: activeCombat.id })
                .update({ character_is_defending: true, last_action_time: new Date() });
            playerIsDefending = true;
            playerActionSuccessful = true;
        }
        else {
            throw new common_1.BadRequestException('Invalid combat action.');
        }
        if (enemyCurrentHealth <= 0) {
            combatLogMessages.push(`Legyőzted: ${enemyBaseData.name}! ${enemyBaseData.defeat_text ?? ''}`);
            this.logger.log(`Enemy ${enemyBaseData.id} defeated by character ${character.id}`);
            await this.knex('active_combats').where({ id: activeCombat.id }).del();
            if (enemyBaseData.xp_reward > 0) {
                const xpResult = await this.characterService.addXp(character.id, enemyBaseData.xp_reward);
                combatLogMessages.push(`Kaptál ${enemyBaseData.xp_reward} tapasztalati pontot.`);
                if (xpResult.leveledUp)
                    combatLogMessages.push(...xpResult.messages);
                character =
                    (await this.characterService.findById(character.id)) ?? character;
            }
            if (enemyBaseData.item_drop_id) {
                combatLogMessages.push(`Az ellenfél eldobott valamit! (Tárgy ID: ${enemyBaseData.item_drop_id})`);
                await this.characterService.addItemToInventory(character.id, enemyBaseData.item_drop_id, 1);
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
            };
        }
        if (enemyCurrentHealth > 0 && playerActionSuccessful) {
            combatLogMessages.push(`${enemyBaseData.name} rád támad (${enemyBaseData.attack_description ?? ''})!`);
            const playerDiceDef = Math.floor(Math.random() * 6) + 1;
            const enemyDiceAtk = Math.floor(Math.random() * 6) + 1;
            const enemyAttackVal = (enemyBaseData.skill ?? 0) + enemyDiceAtk;
            let playerEffectiveDefenseSkill = character.skill ?? 0;
            const currentCombatTurnState = await this.knex('active_combats')
                .where({ id: activeCombat.id })
                .first();
            if (!currentCombatTurnState)
                throw new common_1.InternalServerErrorException('Combat state lost mid-turn!');
            let actualPlayerDefenseValue = playerEffectiveDefenseSkill + playerDiceDef;
            if (currentCombatTurnState.character_is_defending) {
                this.logger.debug(`Player is defending! Applying defense bonus.`);
                combatLogMessages.push(`Védekezel!`);
                actualPlayerDefenseValue += character.skill ?? 0;
            }
            this.logger.debug(`Enemy attack roll: ${enemyAttackVal} vs Player effective defense roll: ${actualPlayerDefenseValue}`);
            if (enemyAttackVal > actualPlayerDefenseValue) {
                const baseEnemyDamage = 5;
                const playerDefenseStat = character.defense ?? 0;
                let actualDamageTaken = Math.max(0, baseEnemyDamage - playerDefenseStat);
                if (currentCombatTurnState.character_is_defending) {
                    actualDamageTaken = Math.floor(actualDamageTaken / 2);
                    combatLogMessages.push(`A védekezésed csökkentette a sebzést!`);
                }
                playerCurrentHealth = Math.max(0, playerCurrentHealth - actualDamageTaken);
                combatLogMessages.push(`Eltalált! Sebzés: ${actualDamageTaken}. Életerőd: ${playerCurrentHealth}`);
                character = await this.characterService.updateCharacter(character.id, {
                    health: playerCurrentHealth,
                });
            }
            else {
                combatLogMessages.push(`Sikeresen kivédted ${enemyBaseData.name} támadását!`);
            }
            if (currentCombatTurnState.character_is_defending) {
                await this.knex('active_combats')
                    .where({ id: activeCombat.id })
                    .update({ character_is_defending: false });
            }
            if (playerCurrentHealth <= 0) {
                return {
                    character,
                    combatLogMessages,
                    isCombatOver: true,
                    nextNodeId: DEFEAT_NODE_ID,
                    enemy: undefined,
                };
            }
        }
        this.logger.log(`Combat continues for user ${userId}. Round finished.`);
        const finalCharacterStateInRound = await this.characterService.findById(character.id);
        if (!finalCharacterStateInRound)
            throw new common_1.InternalServerErrorException('Character state lost!');
        const currentCombatEnemyData = {
            id: enemyBaseData.id,
            name: enemyBaseData.name,
            health: enemyBaseData.health,
            currentHealth: enemyCurrentHealth,
            skill: enemyBaseData.skill,
        };
        return {
            character: finalCharacterStateInRound,
            enemy: currentCombatEnemyData,
            combatLogMessages,
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