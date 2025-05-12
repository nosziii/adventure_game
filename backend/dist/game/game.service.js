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
var GameService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameService = void 0;
const common_1 = require("@nestjs/common");
const knex_1 = require("knex");
const database_module_1 = require("../database/database.module");
const character_service_1 = require("../character.service");
const STARTING_NODE_ID = 1;
let GameService = GameService_1 = class GameService {
    knex;
    characterService;
    logger = new common_1.Logger(GameService_1.name);
    constructor(knex, characterService) {
        this.knex = knex;
        this.characterService = characterService;
    }
    mapCharacterToDto(character) {
        return {
            health: character.health,
            skill: character.skill,
            luck: character.luck,
            stamina: character.stamina,
            name: character.name,
            level: character.level,
            xp: character.xp,
            xpToNextLevel: character.xp_to_next_level,
        };
    }
    async getCurrentGameState(userId) {
        this.logger.log(`Workspaceing game state for user ID: ${userId}`);
        const character = await this.characterService.findOrCreateByUserId(userId);
        this.logger.debug('Character data fetched/created:', JSON.stringify(character, null, 2));
        const activeCombat = await this.knex('active_combats')
            .where({ character_id: character.id })
            .first();
        let inventory = null;
        this.logger.debug(`Workspaceing inventory for character ID: ${character.id}`);
        if (activeCombat) {
            this.logger.log(`User ${userId} is in active combat (Combat ID: ${activeCombat.id}, Enemy ID: ${activeCombat.enemy_id})`);
            const enemyBaseData = await this.knex('enemies')
                .where({ id: activeCombat.enemy_id })
                .first();
            if (!enemyBaseData) {
                this.logger.error(`Enemy data not found for active combat! Enemy ID: ${activeCombat.enemy_id}`);
                await this.knex('active_combats').where({ id: activeCombat.id }).del();
                throw new common_1.InternalServerErrorException('Combat data corrupted, enemy not found.');
            }
            inventory = await this.characterService.getInventory(character.id);
            this.logger.debug('Inventory data fetched:', JSON.stringify(inventory, null, 2));
            const enemyData = {
                id: enemyBaseData.id,
                name: enemyBaseData.name,
                health: enemyBaseData.health,
                currentHealth: activeCombat.enemy_current_health,
                skill: enemyBaseData.skill,
            };
            return {
                node: null,
                choices: [],
                character: this.mapCharacterToDto(character),
                combat: enemyData,
                inventory: inventory,
                messages: [],
                equippedWeaponId: character.equipped_weapon_id,
                equippedArmorId: character.equipped_armor_id,
            };
        }
        else {
            this.logger.log(`User ${userId} is not in combat. Current node: ${character.current_node_id}`);
            let currentNodeId = character.current_node_id ?? STARTING_NODE_ID;
            inventory = await this.characterService.getInventory(character.id);
            if (character.current_node_id !== currentNodeId) {
                this.logger.warn(`Character ${character.id} had null current_node_id, setting to STARTING_NODE_ID ${STARTING_NODE_ID}`);
                const updatedCharacter = await this.characterService.updateCharacter(character.id, { current_node_id: currentNodeId });
                Object.assign(character, updatedCharacter);
            }
            this.logger.debug(`Workspaceing story node with ID: ${currentNodeId}`);
            const currentNode = await this.knex('story_nodes')
                .where({ id: currentNodeId })
                .first();
            if (!currentNode) {
                this.logger.error(`Story node ${currentNodeId} not found!`);
                throw new common_1.NotFoundException(`Story node ${currentNodeId} not found.`);
            }
            this.logger.debug(`Found story node: ${currentNode.id}`);
            this.logger.debug(`Workspaceing and evaluating choices for source node ID: ${currentNodeId}`);
            const potentialChoices = await this.knex('choices').where({
                source_node_id: currentNodeId,
            });
            const availableChoicesPromises = potentialChoices.map(async (choice) => {
                const isAvailable = await this.checkChoiceAvailability(choice, character);
                this.logger.debug(`Choice ${choice.id} (${choice.text}) - Evaluated Availability: ${isAvailable}`);
                return {
                    id: choice.id,
                    text: choice.text,
                    isAvailable: isAvailable,
                };
            });
            const availableChoices = await Promise.all(availableChoicesPromises);
            this.logger.debug(`Evaluated ${availableChoices.length} choices.`);
            return {
                node: {
                    id: currentNode.id,
                    text: currentNode.text,
                    image: currentNode.image,
                },
                choices: availableChoices,
                character: this.mapCharacterToDto(character),
                combat: null,
                inventory: inventory,
                messages: [],
                equippedWeaponId: character.equipped_weapon_id,
                equippedArmorId: character.equipped_armor_id,
            };
        }
    }
    async checkChoiceAvailability(choice, character) {
        if (choice.required_item_id !== null &&
            choice.required_item_id !== undefined) {
            this.logger.debug(`Checking required item ID: ${choice.required_item_id}`);
            const hasRequiredItem = await this.characterService.hasItem(character.id, choice.required_item_id);
            if (!hasRequiredItem) {
                this.logger.debug(`Choice ${choice.id} unavailable: Missing required item ${choice.required_item_id}`);
                return false;
            }
            this.logger.debug(`Required item ${choice.required_item_id} found in inventory.`);
        }
        if (choice.item_cost_id !== null && choice.item_cost_id !== undefined) {
            this.logger.debug(`Checking item cost ID: ${choice.item_cost_id}`);
            const hasCostItem = await this.characterService.hasItem(character.id, choice.item_cost_id);
            if (!hasCostItem) {
                this.logger.debug(`Choice ${choice.id} unavailable: Missing cost item ${choice.item_cost_id}`);
                return false;
            }
            this.logger.debug(`Required cost item ${choice.item_cost_id} found in inventory.`);
        }
        const reqStatCheck = choice.required_stat_check;
        if (typeof reqStatCheck === 'string') {
            this.logger.debug(`Evaluating stat requirement: "${reqStatCheck}"`);
            const parts = reqStatCheck.match(/(\w+)\s*(>=|<=|>|<|==|!=)\s*(\d+)/);
            if (parts) {
                const [, stat, operator, valueStr] = parts;
                const requiredValue = parseInt(valueStr, 10);
                let characterValue;
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
                    this.logger.debug(`Stat ${stat} is null/undefined for character ${character.id}`);
                    return false;
                }
                this.logger.debug(`Checking: <span class="math-inline">\{stat\} \(</span>{characterValue}) ${operator} ${requiredValue}`);
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
                this.logger.debug(`Requirement ${reqStatCheck} result: ${conditionMet}`);
                if (!conditionMet) {
                    return false;
                }
            }
            else {
                this.logger.warn(`Could not parse stat requirement string: ${reqStatCheck}`);
                return false;
            }
        }
        return true;
    }
    async makeChoice(userId, choiceId) {
        this.logger.log(`Processing choice ID: ${choiceId} for user ID: ${userId}`);
        const character = await this.characterService.findOrCreateByUserId(userId);
        const existingCombat = await this.knex('active_combats')
            .where({ character_id: character.id })
            .first();
        if (existingCombat) {
            throw new common_1.ForbiddenException('Cannot make choices while in combat.');
        }
        const currentNodeId = character.current_node_id;
        if (!currentNodeId) {
            throw new common_1.BadRequestException('Cannot make a choice without being at a node.');
        }
        const currentNode = await this.knex('story_nodes')
            .where({ id: currentNodeId })
            .first();
        if (!currentNode) {
            throw new common_1.NotFoundException(`Current node ${currentNodeId} not found!`);
        }
        const choice = await this.knex('choices')
            .where({ id: choiceId, source_node_id: currentNodeId })
            .first();
        if (!choice) {
            throw new common_1.BadRequestException(`Invalid choice ID: ${choiceId}`);
        }
        if (!(await this.checkChoiceAvailability(choice, character))) {
            throw new common_1.ForbiddenException('You do not meet the requirements for this choice.');
        }
        if (choice.item_cost_id !== null && choice.item_cost_id !== undefined) {
            this.logger.log(`Choice ${choiceId} has item cost: ${choice.item_cost_id}. Attempting to remove from inventory.`);
            const removedSuccessfully = await this.characterService.removeItemFromInventory(character.id, choice.item_cost_id, 1);
            if (!removedSuccessfully) {
                this.logger.error(`Failed to remove cost item ${choice.item_cost_id} for choice ${choiceId} - item might have vanished?`);
                throw new common_1.InternalServerErrorException('Failed to process item cost.');
            }
            this.logger.log(`Item ${choice.item_cost_id} successfully removed as cost.`);
        }
        const targetNodeId = choice.target_node_id;
        this.logger.debug(`Choice ${choiceId} valid. Target node ID: ${targetNodeId}`);
        const targetNode = await this.knex('story_nodes')
            .where({ id: targetNodeId })
            .first();
        if (!targetNode) {
            throw new common_1.InternalServerErrorException('Target node missing.');
        }
        let healthUpdate = character.health;
        if (currentNode.health_effect !== null &&
            currentNode.health_effect !== undefined) {
            this.logger.log(`Applying health effect ${currentNode.health_effect} from current node ${currentNodeId}`);
            healthUpdate = Math.max(0, character.health + currentNode.health_effect);
        }
        if (currentNode.item_reward_id !== null &&
            currentNode.item_reward_id !== undefined) {
            this.logger.log(`Current node ${currentNodeId} grants item reward ID: ${currentNode.item_reward_id}`);
            try {
                await this.characterService.addItemToInventory(character.id, currentNode.item_reward_id, 1);
                this.logger.log(`Item ${currentNode.item_reward_id} added to inventory.`);
            }
            catch (itemError) {
                this.logger.error(`Failed to add item reward ${currentNode.item_reward_id}: ${itemError}`);
            }
        }
        if (targetNode.enemy_id) {
            this.logger.log(`Choice leads to combat! Node ${targetNodeId} has enemy ID: ${targetNode.enemy_id}`);
            if (healthUpdate !== character.health) {
                await this.characterService.updateCharacter(character.id, {
                    health: healthUpdate,
                });
            }
            const enemy = await this.knex('enemies')
                .where({ id: targetNode.enemy_id })
                .first();
            if (!enemy) {
                throw new common_1.InternalServerErrorException('Enemy data missing for combat.');
            }
            await this.knex('active_combats').insert({
                character_id: character.id,
                enemy_id: enemy.id,
                enemy_current_health: enemy.health,
            });
            await this.knex('player_progress').insert({
                character_id: character.id,
                node_id: targetNodeId,
                choice_id_taken: choice.id,
            });
        }
        else {
            this.logger.log(`Choice leads to non-combat node ${targetNodeId}`);
            await this.characterService.updateCharacter(character.id, {
                current_node_id: targetNodeId,
                health: healthUpdate,
            });
            await this.knex('player_progress').insert({
                character_id: character.id,
                node_id: targetNodeId,
                choice_id_taken: choice.id,
            });
        }
        this.logger.log(`Choice processed for user ${userId}. Fetching new game state.`);
        return this.getCurrentGameState(userId);
    }
    async handleCombatAction(userId, actionDto) {
        this.logger.log(`Handling combat action '${actionDto.action}' for user ID: ${userId}`);
        const character = await this.characterService.findOrCreateByUserId(userId);
        const activeCombat = await this.knex('active_combats')
            .where({ character_id: character.id })
            .first();
        if (!activeCombat) {
            this.logger.warn(`User ${userId} tried combat action but is not in combat.`);
            throw new common_1.ForbiddenException('You are not currently in combat.');
        }
        const enemyBaseData = await this.knex('enemies')
            .where({ id: activeCombat.enemy_id })
            .first();
        if (!enemyBaseData) {
            this.logger.error(`Enemy data not found for active combat! Enemy ID: ${activeCombat.enemy_id}`);
            await this.knex('active_combats').where({ id: activeCombat.id }).del();
            throw new common_1.InternalServerErrorException('Combat data corrupted, enemy not found.');
        }
        let enemyCurrentHealth = activeCombat.enemy_current_health;
        let playerCurrentHealth = character.health;
        const combatLogMessages = [];
        let playerActionSuccessful = false;
        if (actionDto.action === 'attack') {
            combatLogMessages.push(`Megtámadod (${enemyBaseData.name})!`);
            const playerDice = Math.floor(Math.random() * 6) + 1;
            const enemyDice = Math.floor(Math.random() * 6) + 1;
            const playerAttack = (character.skill ?? 0) + playerDice;
            const enemyDefense = (enemyBaseData.skill ?? 0) + enemyDice;
            if (playerAttack > enemyDefense) {
                let baseDamage = 1;
                const inventory = await this.characterService.getInventory(character.id);
                const weapon = inventory.find((item) => item.type === 'weapon');
                if (weapon && typeof weapon.effect === 'string') {
                    this.logger.debug(`Found weapon: ${weapon.name} (Effect: ${weapon.effect})`);
                    const damageMatch = weapon.effect.match(/damage\+(\d+)/);
                    if (damageMatch && damageMatch[1]) {
                        baseDamage = parseInt(damageMatch[1], 10);
                        this.logger.debug(`Weapon base damage set to: ${baseDamage}`);
                    }
                    else {
                        this.logger.warn(`Weapon ${weapon.name} found, but no valid 'damage+X' effect string.`);
                    }
                }
                else {
                    this.logger.debug('No weapon found in inventory, using base unarmed damage.');
                }
                const skillBonus = Math.floor((character.skill ?? 0) / 5);
                const totalDamage = baseDamage + skillBonus;
                this.logger.debug(`Calculating player damage: base=${baseDamage}, skillBonus=${skillBonus} (from skill=${character.skill}), total=${totalDamage}`);
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
            this.logger.debug(`Checking enemy defeat after attack. Current Health: ${enemyCurrentHealth}`);
            if (enemyCurrentHealth <= 0) {
                this.logger.log(`>>> ENEMY DEFEATED BLOCK ENTERED (After Attack) <<< Health: ${enemyCurrentHealth}`);
                combatLogMessages.push(`Legyőzted: ${enemyBaseData.name}! ${enemyBaseData.defeat_text ?? ''}`);
                await this.knex('active_combats').where({ id: activeCombat.id }).del();
                const victoryNodeId = 8;
                if (enemyBaseData.xp_reward > 0) {
                    this.logger.log(`Adding ${enemyBaseData.xp_reward} XP for defeating enemy ${enemyBaseData.id}`);
                    try {
                        const xpResult = await this.characterService.addXp(character.id, enemyBaseData.xp_reward);
                        combatLogMessages.push(`Kaptál ${enemyBaseData.xp_reward} tapasztalati pontot.`);
                        if (xpResult.leveledUp && xpResult.messages.length > 0) {
                            combatLogMessages.push(...xpResult.messages);
                        }
                    }
                    catch (xpError) {
                        this.logger.error(`Failed to add XP for character ${character.id}: ${xpError}`);
                    }
                }
                this.logger.log(`Moving character ${character.id} to victory node ${victoryNodeId}`);
                if (enemyBaseData.item_drop_id !== null &&
                    enemyBaseData.item_drop_id !== undefined) {
                    combatLogMessages.push(`Az ellenfél eldobott valamit! (Tárgy ID: ${enemyBaseData.item_drop_id})`);
                    try {
                        await this.characterService.addItemToInventory(character.id, enemyBaseData.item_drop_id, 1);
                        this.logger.log(`Item ${enemyBaseData.item_drop_id} added to inventory.`);
                    }
                    catch (itemDropError) {
                        this.logger.error(`Failed to add item drop ${enemyBaseData.item_drop_id}: ${itemDropError}`);
                    }
                }
                await this.characterService.updateCharacter(character.id, {
                    current_node_id: victoryNodeId,
                });
                await this.knex('player_progress').insert({
                    character_id: character.id,
                    node_id: victoryNodeId,
                    choice_id_taken: null,
                });
                const finalState = await this.getCurrentGameState(userId);
                finalState.messages = combatLogMessages;
                this.logger.log('>>> RETURNING FINAL STATE FROM VICTORY BLOCK (After Attack) <<<');
                return finalState;
            }
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
                playerActionSuccessful = true;
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
                    playerActionSuccessful = true;
                }
                else if (item.effect && item.effect.startsWith('heal+')) {
                    const healAmount = parseInt(item.effect.split('+')[1] ?? '0', 10);
                    if (healAmount > 0) {
                        const maxHp = 100;
                        const previousPlayerHealth = playerCurrentHealth;
                        playerCurrentHealth = Math.min(maxHp, playerCurrentHealth + healAmount);
                        const healedAmount = playerCurrentHealth - previousPlayerHealth;
                        if (healedAmount > 0) {
                            combatLogMessages.push(`Gyógyító italt használtál (${item.name}). Visszatöltöttél ${healedAmount} életerőt! HP: ${playerCurrentHealth}`);
                            const updatedCharacterData = await this.characterService.updateCharacter(character.id, {
                                health: playerCurrentHealth,
                            });
                            playerCurrentHealth = updatedCharacterData.health;
                            const removed = await this.characterService.removeItemFromInventory(character.id, itemIdToUse, 1);
                            if (!removed) {
                                this.logger.error(`Failed to remove item ${itemIdToUse} after use`);
                            }
                            playerActionSuccessful = true;
                        }
                        else {
                            combatLogMessages.push(`Már így is maximum életerőn vagy.`);
                            playerActionSuccessful = true;
                        }
                    }
                    else {
                        combatLogMessages.push(`Ez a tárgy (${item.name}) nem gyógyít.`);
                        playerActionSuccessful = true;
                    }
                }
                else {
                    combatLogMessages.push(`Ezt a tárgyat (${item.name}) most nem tudod használni.`);
                    playerActionSuccessful = true;
                }
            }
        }
        else {
            this.logger.error(`Unknown combat action received: ${actionDto.action}`);
            throw new common_1.BadRequestException('Invalid combat action.');
        }
        if (enemyCurrentHealth > 0 && playerActionSuccessful) {
            combatLogMessages.push(`${enemyBaseData.name} rád támad (${enemyBaseData.attack_description ?? ''})!`);
            const playerDiceDef = Math.floor(Math.random() * 6) + 1;
            const enemyDiceAtk = Math.floor(Math.random() * 6) + 1;
            const enemyAttack = (enemyBaseData.skill ?? 0) + enemyDiceAtk;
            const playerDefense = (character.skill ?? 0) + playerDiceDef;
            if (enemyAttack > playerDefense) {
                const enemyDamage = 5;
                playerCurrentHealth = Math.max(0, playerCurrentHealth - enemyDamage);
                combatLogMessages.push(`Eltalált! Sebzés: ${enemyDamage}. Életerőd: ${playerCurrentHealth}`);
                await this.characterService.updateCharacter(character.id, {
                    health: playerCurrentHealth,
                });
            }
            else {
                combatLogMessages.push(`Sikeresen kivédted a támadást!`);
            }
            if (playerCurrentHealth <= 0) {
                combatLogMessages.push(`Leestél a lábadról... Vége a kalandnak.`);
                this.logger.log(`Character ${character.id} defeated by enemy ${enemyBaseData.id}.`);
                await this.knex('active_combats').where({ id: activeCombat.id }).del();
                const defeatNodeId = 3;
                await this.characterService.updateCharacter(character.id, {
                    current_node_id: defeatNodeId,
                    health: 0,
                });
                await this.knex('player_progress').insert({
                    character_id: character.id,
                    node_id: defeatNodeId,
                    choice_id_taken: null,
                });
                const finalState = await this.getCurrentGameState(userId);
                finalState.messages = combatLogMessages;
                return finalState;
            }
        }
        this.logger.log(`Combat continues for user ${userId}. Round finished.`);
        const updatedCharacter = await this.characterService.findById(character.id);
        if (!updatedCharacter)
            throw new common_1.InternalServerErrorException('Character vanished after combat round!');
        const currentInventory = await this.characterService.getInventory(updatedCharacter.id);
        const currentCombatState = {
            id: enemyBaseData.id,
            name: enemyBaseData.name,
            health: enemyBaseData.health,
            currentHealth: enemyCurrentHealth,
            skill: enemyBaseData.skill,
        };
        const resultState = {
            node: null,
            choices: [],
            character: this.mapCharacterToDto(updatedCharacter),
            combat: currentCombatState,
            inventory: currentInventory,
            messages: combatLogMessages,
        };
        return resultState;
    }
    async useItemOutOfCombat(userId, itemId) {
        this.logger.log(`Attempting to use item ${itemId} for user ${userId} outside of combat.`);
        const character = await this.characterService.findOrCreateByUserId(userId);
        const activeCombat = await this.knex('active_combats')
            .where({ character_id: character.id })
            .first();
        if (activeCombat) {
            this.logger.warn(`User ${userId} tried to use item ${itemId} outside combat, but is in combat.`);
            throw new common_1.ForbiddenException('Cannot use items this way while in combat.');
        }
        const hasItem = await this.characterService.hasItem(character.id, itemId);
        if (!hasItem) {
            this.logger.warn(`User ${userId} tried to use item ${itemId} but doesn't have it.`);
            throw new common_1.BadRequestException('You do not have this item.');
        }
        const item = await this.knex('items').where({ id: itemId }).first();
        if (!item) {
            throw new common_1.InternalServerErrorException('Item data inconsistency.');
        }
        if (!item.usable) {
            this.logger.warn(`User ${userId} tried to use non-usable item ${itemId}.`);
            throw new common_1.BadRequestException(`This item (${item.name}) cannot be used.`);
        }
        let characterStatsUpdated = false;
        if (item.effect && item.effect.startsWith('heal+')) {
            const healAmount = parseInt(item.effect.split('+')[1] ?? '0', 10);
            if (healAmount > 0) {
                const maxHp = 100;
                const currentHealth = character.health;
                const newHealth = Math.min(maxHp, currentHealth + healAmount);
                if (newHealth > currentHealth) {
                    this.logger.log(`Applying heal effect: ${healAmount} to character ${character.id}. New health: ${newHealth}`);
                    await this.characterService.updateCharacter(character.id, {
                        health: newHealth,
                    });
                    const removed = await this.characterService.removeItemFromInventory(character.id, itemId, 1);
                    if (!removed) {
                        this.logger.error(`Failed to remove item ${itemId} after use for character ${character.id}!`);
                    }
                    characterStatsUpdated = true;
                }
                else {
                    this.logger.log(`Character ${character.id} health already full, item ${itemId} not consumed.`);
                }
            }
            else {
                this.logger.warn(`Item ${itemId} has zero heal amount.`);
            }
        }
        else {
            this.logger.warn(`Item ${itemId} has unhandled usable effect: ${item.effect}`);
            throw new common_1.BadRequestException(`Cannot use this type of item (${item.name}) right now.`);
        }
        const finalCharacter = characterStatsUpdated
            ? await this.characterService.findById(character.id)
            : character;
        if (!finalCharacter) {
            throw new common_1.InternalServerErrorException('Character data not found after using item.');
        }
        return this.mapCharacterToDto(finalCharacter);
    }
    async getPlayerProgress(userId) {
        this.logger.log(`Workspaceing rich player progress for user ID: ${userId}`);
        const character = await this.characterService.findOrCreateByUserId(userId);
        if (!character) {
            return { nodes: [], edges: [] };
        }
        const progressRecords = await this.knex('player_progress')
            .where({ character_id: character.id })
            .orderBy('visited_at', 'asc');
        if (progressRecords.length === 0) {
            return { nodes: [], edges: [] };
        }
        const nodeIds = new Set();
        const choiceIds = new Set();
        progressRecords.forEach((record) => {
            nodeIds.add(record.node_id);
            if (record.choice_id_taken) {
                choiceIds.add(record.choice_id_taken);
            }
        });
        const nodesData = await this.knex('story_nodes')
            .whereIn('id', Array.from(nodeIds))
            .select('id', 'text');
        const mapNodes = nodesData.map((n) => ({
            id: n.id,
            textSnippet: n.text.substring(0, 30) + (n.text.length > 30 ? '...' : ''),
        }));
        let choicesData = [];
        if (choiceIds.size > 0) {
            choicesData = await this.knex('choices')
                .whereIn('id', Array.from(choiceIds))
                .select('id', 'text', 'source_node_id');
        }
        const choicesCache = new Map(choicesData.map((c) => [c.id, c]));
        const mapEdges = [];
        let previousNodeId = null;
        for (const record of progressRecords) {
            let fromNode = null;
            let choiceText = undefined;
            if (record.choice_id_taken) {
                const choice = choicesCache.get(record.choice_id_taken);
                if (choice) {
                    fromNode = choice.source_node_id;
                    if (choice.text) {
                        choiceText =
                            choice.text.substring(0, 20) +
                                (choice.text.length > 20 ? '...' : '');
                    }
                }
                else {
                    this.logger.warn(`Choice with ID ${record.choice_id_taken} not found in cache for progress record.`);
                    fromNode = previousNodeId;
                }
            }
            else {
                fromNode = null;
            }
            mapEdges.push({
                from: fromNode,
                to: record.node_id,
                choiceTextSnippet: choiceText,
            });
            previousNodeId = record.node_id;
        }
        const uniqueEdges = mapEdges.filter((edge, index, self) => index ===
            self.findIndex((e) => e.from === edge.from && e.to === edge.to));
        return { nodes: mapNodes, edges: uniqueEdges };
    }
};
exports.GameService = GameService;
exports.GameService = GameService = GameService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(database_module_1.KNEX_CONNECTION)),
    __metadata("design:paramtypes", [Function, character_service_1.CharacterService])
], GameService);
//# sourceMappingURL=game.service.js.map