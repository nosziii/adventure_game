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
const combat_service_1 = require("../combat.service");
const STARTING_NODE_ID = 1;
let GameService = GameService_1 = class GameService {
    knex;
    characterService;
    combatService;
    logger = new common_1.Logger(GameService_1.name);
    constructor(knex, characterService, combatService) {
        this.knex = knex;
        this.characterService = characterService;
        this.combatService = combatService;
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
            defense: character.defense,
            talentPointsAvailable: character.talent_points_available,
        };
    }
    async processCombatAction(userId, actionDto) {
        this.logger.log(`[GameService.processCombatAction] UserID: ${userId}, Action: ${actionDto.action}`);
        const combatResult = await this.combatService.handleCombatAction(userId, actionDto);
        const finalCharacterAfterCombat = combatResult.character;
        const baseCharacterId = finalCharacterAfterCombat.id;
        const activeStoryProgress = await this.characterService.getActiveStoryProgress(baseCharacterId);
        if (!activeStoryProgress) {
            this.logger.error(`[processCombatAction] CRITICAL: No active story progress found for character ${baseCharacterId} after combat action!`);
            throw new common_1.InternalServerErrorException('Failed to retrieve active story progress after combat action.');
        }
        const storyProgressId = activeStoryProgress.id;
        const inventory = await this.characterService.getStoryInventory(storyProgressId);
        this.logger.debug(`[processCombatAction] Inventory fetched for StoryProgressID: ${storyProgressId}`);
        const characterForDto = this.mapCharacterToDto(finalCharacterAfterCombat);
        if (combatResult.isCombatOver) {
            this.logger.log(`[processCombatAction] Combat finished. NextNodeID: ${combatResult.nextNodeId}`);
            const finalNode = combatResult.nextNodeId
                ? await this.knex('story_nodes')
                    .where({ id: combatResult.nextNodeId })
                    .first()
                : null;
            const choicesForFinalNode = finalNode && !finalNode.is_end
                ? await this.knex('choices')
                    .where({ source_node_id: finalNode.id })
                    .then((potentialChoices) => Promise.all(potentialChoices.map(async (choice) => ({
                    id: choice.id,
                    text: choice.text,
                    isAvailable: await this.checkChoiceAvailability(choice, finalCharacterAfterCombat, storyProgressId),
                }))))
                : [];
            return {
                node: finalNode
                    ? { id: finalNode.id, text: finalNode.text, image: finalNode.image }
                    : null,
                choices: choicesForFinalNode,
                character: characterForDto,
                combat: null,
                inventory: inventory,
                roundActions: combatResult.roundActions,
                equippedWeaponId: finalCharacterAfterCombat.equipped_weapon_id,
                equippedArmorId: finalCharacterAfterCombat.equipped_armor_id,
            };
        }
        else {
            this.logger.log(`[processCombatAction] Combat continues.`);
            return {
                node: null,
                choices: [],
                character: characterForDto,
                combat: combatResult.enemy ?? null,
                inventory: inventory,
                roundActions: combatResult.roundActions,
                equippedWeaponId: finalCharacterAfterCombat.equipped_weapon_id,
                equippedArmorId: finalCharacterAfterCombat.equipped_armor_id,
            };
        }
    }
    async getCurrentGameState(userId) {
        this.logger.log(`Workspaceing game state for user ID: ${userId}`);
        const baseCharacter = await this.characterService.findOrCreateByUserId(userId);
        const activeStoryProgress = await this.characterService.getActiveStoryProgress(baseCharacter.id);
        if (!activeStoryProgress) {
            this.logger.warn(`No active story progress found for character ${baseCharacter.id}. User should select a story.`);
            return {
                node: null,
                choices: [],
                character: this.mapCharacterToDto({
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
                }),
                combat: null,
                inventory: [],
                roundActions: null,
                equippedWeaponId: null,
                equippedArmorId: null,
            };
        }
        this.logger.debug(`Active story progress ID: ${activeStoryProgress.id}, Story ID: ${activeStoryProgress.story_id}, Current Node: ${activeStoryProgress.current_node_id}`);
        let characterForState = {
            ...baseCharacter,
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
            await this.characterService.applyPassiveEffects(characterForState);
        const inventory = await this.characterService.getStoryInventory(activeStoryProgress.id);
        this.logger.debug('Inventory fetched (using base character_id for now):', JSON.stringify(inventory));
        const activeCombatDbRecord = await this.knex('active_combats')
            .where({ character_id: baseCharacter.id })
            .first();
        if (activeCombatDbRecord) {
            this.logger.log(`User ${userId} is in active combat (Combat ID: ${activeCombatDbRecord.id})`);
            const enemyBaseData = await this.knex('enemies')
                .where({ id: activeCombatDbRecord.enemy_id })
                .first();
            if (!enemyBaseData) {
                await this.knex('active_combats')
                    .where({ id: activeCombatDbRecord.id })
                    .del();
                throw new common_1.InternalServerErrorException('Combat data corrupted, enemy not found during active combat check.');
            }
            const enemyData = {
                id: enemyBaseData.id,
                name: enemyBaseData.name,
                health: enemyBaseData.health,
                currentHealth: activeCombatDbRecord.enemy_current_health,
                skill: enemyBaseData.skill,
                isChargingSpecial: (activeCombatDbRecord.enemy_charge_turns_current ?? 0) > 0,
                currentChargeTurns: activeCombatDbRecord.enemy_charge_turns_current,
                maxChargeTurns: enemyBaseData.special_attack_charge_turns,
                specialAttackTelegraphText: (activeCombatDbRecord.enemy_charge_turns_current ?? 0) > 0
                    ? enemyBaseData.special_attack_telegraph_text
                    : null,
            };
            return {
                node: null,
                choices: [],
                character: this.mapCharacterToDto(characterForState),
                combat: enemyData,
                inventory: inventory,
                roundActions: null,
                equippedWeaponId: characterForState.equipped_weapon_id,
                equippedArmorId: characterForState.equipped_armor_id,
            };
        }
        else {
            const currentNodeId = characterForState.current_node_id;
            if (!currentNodeId) {
                this.logger.error(`Character ${baseCharacter.id} (ProgressID: ${activeStoryProgress.id}) has no current_node_id in active story! Defaulting to STARTING_NODE_ID.`);
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
                    ],
                };
            }
            const currentNode = await this.knex('story_nodes')
                .where({ id: currentNodeId })
                .first();
            if (!currentNode) {
                throw new common_1.NotFoundException(`Story node ${currentNodeId} not found for active story progress.`);
            }
            const potentialChoices = await this.knex('choices').where({
                source_node_id: currentNodeId,
            });
            const availableChoices = await Promise.all(potentialChoices.map(async (choice) => ({
                id: choice.id,
                text: choice.text,
                isAvailable: await this.checkChoiceAvailability(choice, characterForState, activeStoryProgress.id),
            })));
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
    }
    async checkChoiceAvailability(choice, character, storyProgressId) {
        this.logger.debug(`[GameService.checkChoiceAvailability] Checking choice ID ${choice.id} for character ID ${storyProgressId}`);
        if (choice.item_cost_id) {
            const hasCostItem = await this.characterService.hasStoryItem(storyProgressId, choice.item_cost_id);
            if (!hasCostItem) {
                this.logger.debug(`Choice ${choice.id} unavailable: Missing cost item ${choice.item_cost_id}`);
                return false;
            }
        }
        if (choice.required_item_id) {
            const hasRequiredItem = await this.characterService.hasStoryItem(storyProgressId, choice.required_item_id);
            if (!hasRequiredItem) {
                this.logger.debug(`Choice ${choice.id} unavailable: Missing required item ${choice.required_item_id}`);
                return false;
            }
        }
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
                        this.logger.warn(`Unknown stat '${statName}' in required_stat_check for choice ${choice.id}`);
                        return false;
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
                        this.logger.warn(`Unknown operator '${operator}' in required_stat_check for choice ${choice.id}`);
                        return false;
                }
                if (!conditionMet) {
                    this.logger.debug(`Choice ${choice.id} unavailable: Stat check failed: ${characterStatValue} ${operator} ${requiredValue} (Stat: ${statName})`);
                    return false;
                }
            }
            else {
                this.logger.warn(`Could not parse required_stat_check: "${choice.required_stat_check}" for choice ${choice.id}`);
                return false;
            }
        }
        this.logger.debug(`Choice ID ${choice.id} is available.`);
        return true;
    }
    async makeChoice(userId, choiceId) {
        this.logger.log(`[GameService.makeChoice] UserID: ${userId}, Attempting ChoiceID: ${choiceId}`);
        const baseCharacter = await this.characterService.findOrCreateByUserId(userId);
        const activeStoryProgress = await this.characterService.getActiveStoryProgress(baseCharacter.id);
        if (!activeStoryProgress || activeStoryProgress.current_node_id === null) {
            this.logger.error(`[GameService.makeChoice] No active story or current node for CharacterID: ${baseCharacter.id}.`);
            throw new common_1.BadRequestException('No active game session or current node to make a choice from.');
        }
        const currentNodeId = activeStoryProgress.current_node_id;
        const characterForValidation = await this.characterService.applyPassiveEffects({
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
        const currentNode = await this.knex('story_nodes')
            .where({ id: currentNodeId })
            .first();
        if (!currentNode)
            throw new common_1.NotFoundException(`Current node ${currentNodeId} not found!`);
        const choice = await this.knex('choices')
            .where({ id: choiceId, source_node_id: currentNodeId })
            .first();
        if (!choice)
            throw new common_1.BadRequestException(`Invalid choice ID: ${choiceId} for node ${currentNodeId}`);
        if (!(await this.checkChoiceAvailability(choice, characterForValidation, activeStoryProgress.id))) {
            throw new common_1.ForbiddenException('You do not meet the requirements for this choice.');
        }
        if (choice.item_cost_id !== null && choice.item_cost_id !== undefined) {
            this.logger.log(`Choice ${choiceId} (StoryProgressID: ${activeStoryProgress.id}) has item cost: ${choice.item_cost_id}. Attempting to remove from story inventory.`);
            const removed = await this.characterService.removeStoryItem(activeStoryProgress.id, choice.item_cost_id, 1);
            if (!removed) {
                this.logger.error(`Failed to remove cost item ${choice.item_cost_id} for choice ${choiceId} (StoryProgressID: ${activeStoryProgress.id}).`);
                throw new common_1.InternalServerErrorException('Failed to process item cost.');
            }
            this.logger.log(`Item ${choice.item_cost_id} successfully removed as cost for StoryProgressID: ${activeStoryProgress.id}.`);
        }
        const targetNodeId = choice.target_node_id;
        const targetNode = await this.knex('story_nodes')
            .where({ id: targetNodeId })
            .first();
        if (!targetNode)
            throw new common_1.InternalServerErrorException(`Target node ${targetNodeId} missing for choice ${choiceId}.`);
        let newHealthForProgress = characterForValidation.health;
        if (currentNode.health_effect !== null &&
            currentNode.health_effect !== undefined) {
            newHealthForProgress = Math.max(0, characterForValidation.health + currentNode.health_effect);
        }
        if (currentNode.item_reward_id !== null &&
            currentNode.item_reward_id !== undefined) {
            this.logger.log(`Node ${currentNodeId} grants item reward ID: ${currentNode.item_reward_id} to StoryProgressID: ${activeStoryProgress.id}`);
            await this.characterService.addStoryItem(activeStoryProgress.id, currentNode.item_reward_id, 1);
            this.logger.log(`Item ${currentNode.item_reward_id} added to story inventory for StoryProgressID: ${activeStoryProgress.id}.`);
        }
        const progressUpdates = {
            health: newHealthForProgress,
        };
        if (targetNode.enemy_id) {
            this.logger.log(`Choice leads to combat at node ${targetNodeId} (StoryProgressID: ${activeStoryProgress.id})`);
            const enemy = await this.knex('enemies')
                .where({ id: targetNode.enemy_id })
                .first();
            if (!enemy)
                throw new common_1.InternalServerErrorException(`Enemy ${targetNode.enemy_id} not found.`);
            await this.knex('active_combats').insert({
                character_id: baseCharacter.id,
                enemy_id: enemy.id,
                enemy_current_health: enemy.health,
            });
            await this.knex('player_progress').insert({
                character_story_progress_id: activeStoryProgress.id,
                node_id: targetNodeId,
                choice_id_taken: choice.id,
            });
        }
        else {
            this.logger.log(`Choice leads to non-combat node ${targetNodeId} (StoryProgressID: ${activeStoryProgress.id})`);
            progressUpdates.current_node_id = targetNodeId;
            await this.knex('player_progress').insert({
                character_story_progress_id: activeStoryProgress.id,
                node_id: targetNodeId,
                choice_id_taken: choice.id,
            });
        }
        if (Object.keys(progressUpdates).length > 0) {
            this.logger.debug(`Updating story progress ${activeStoryProgress.id} with: ${JSON.stringify(progressUpdates)}`);
            await this.characterService.updateStoryProgress(activeStoryProgress.id, progressUpdates);
        }
        return this.getCurrentGameState(userId);
    }
    async useItemOutOfCombat(userId, itemId) {
        this.logger.log(`Attempting to use item ${itemId} for user ${userId} outside of combat.`);
        const baseCharacter = await this.characterService.findOrCreateByUserId(userId);
        const activeStoryProgress = await this.characterService.getActiveStoryProgress(baseCharacter.id);
        if (!activeStoryProgress) {
            this.logger.warn(`User ${userId} (Character ${baseCharacter.id}) has no active story progress to use item from.`);
            throw new common_1.BadRequestException('No active story to use items in.');
        }
        const progressId = activeStoryProgress.id;
        const existingCombat = await this.knex('active_combats')
            .where({ character_id: baseCharacter.id })
            .first();
        if (existingCombat) {
            throw new common_1.ForbiddenException('Cannot use items this way while in combat.');
        }
        const hasItem = await this.characterService.hasStoryItem(progressId, itemId, 1);
        if (!hasItem) {
            this.logger.warn(`User ${userId} (StoryProgress ${progressId}) tried to use item ${itemId} but doesn't have it.`);
            throw new common_1.BadRequestException('You do not have this item in your current story inventory.');
        }
        const item = await this.knex('items')
            .where({ id: itemId })
            .first();
        if (!item)
            throw new common_1.InternalServerErrorException('Item data inconsistency.');
        if (!item.usable)
            throw new common_1.BadRequestException(`This item (${item.name}) cannot be used.`);
        let characterStatsUpdated = false;
        let newPlayerHealth = activeStoryProgress.health;
        if (item.effect && item.effect.startsWith('heal+')) {
            const healAmount = parseInt(item.effect.split('+')[1] ?? '0', 10);
            if (healAmount > 0) {
                const maxHp = activeStoryProgress.stamina ?? 100;
                const previousPlayerHealth = newPlayerHealth;
                newPlayerHealth = Math.min(maxHp, newPlayerHealth + healAmount);
                if (newPlayerHealth > previousPlayerHealth) {
                    this.logger.log(`Applying heal effect: ${healAmount} to StoryProgress ${progressId}. New health: ${newPlayerHealth}`);
                    await this.characterService.updateStoryProgress(progressId, {
                        health: newPlayerHealth,
                    });
                    const removed = await this.characterService.removeStoryItem(progressId, itemId, 1);
                    if (!removed)
                        this.logger.error(`Failed to remove item ${itemId} after use for StoryProgress ${progressId}!`);
                    characterStatsUpdated = true;
                }
                else {
                    this.logger.log(`StoryProgress ${progressId} health already full, item ${itemId} not consumed.`);
                }
            }
            else {
                this.logger.warn(`Item ${itemId} has zero or invalid heal amount.`);
            }
        }
        else {
            this.logger.warn(`Item ${itemId} has unhandled usable effect: ${item.effect}`);
            throw new common_1.BadRequestException(`Cannot use this type of item (${item.name}) right now.`);
        }
        const finalHydratedCharacter = await this.characterService.getHydratedCharacterForStory(baseCharacter.id, progressId);
        if (!finalHydratedCharacter) {
            throw new common_1.InternalServerErrorException('Character data not found after using item (for DTO).');
        }
        return this.mapCharacterToDto(finalHydratedCharacter);
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
    async getPublishedStories(userId) {
        this.logger.log(`Workspaceing published stories with progress for user ID: ${userId}`);
        const character = await this.characterService.findOrCreateByUserId(userId);
        const stories = await this.knex('stories')
            .select('stories.id as storyId', 'stories.title', 'stories.description', 'csp.current_node_id as currentNodeIdInStory', 'csp.last_played_at as lastPlayedAt', 'csp.is_active as isActive')
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
            lastPlayedAt: s.lastPlayedAt ? new Date(s.lastPlayedAt) : null,
            currentNodeIdInStory: s.currentNodeIdInStory,
            isActive: s.isActive ?? false,
        }));
    }
};
exports.GameService = GameService;
exports.GameService = GameService = GameService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(database_module_1.KNEX_CONNECTION)),
    __metadata("design:paramtypes", [Function, character_service_1.CharacterService,
        combat_service_1.CombatService])
], GameService);
//# sourceMappingURL=game.service.js.map