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
var CharacterService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CharacterService = void 0;
const common_1 = require("@nestjs/common");
const knex_1 = require("knex");
const database_module_1 = require("./database/database.module");
const STARTING_NODE_ID = 1;
const DEFAULT_HEALTH = 100;
const DEFAULT_SKILL = 10;
const DEFAULT_LUCK = 5;
const DEFAULT_STAMINA = 100;
const DEFAULT_DEFENSE = 0;
const DEFAULT_LEVEL = 1;
const DEFAULT_XP = 0;
const DEFAULT_XP_TO_NEXT_LEVEL = 100;
const STAT_INCREASE_PER_TALENT_POINT = {
    skill: 1,
    luck: 1,
    defense: 1,
    stamina: 5,
};
let CharacterService = CharacterService_1 = class CharacterService {
    knex;
    logger = new common_1.Logger(CharacterService_1.name);
    constructor(knex) {
        this.knex = knex;
    }
    async findByUserId(userId) {
        this.logger.debug(`Finding character for user ID: ${userId}`);
        const character = await this.knex('characters')
            .where({ user_id: userId })
            .first();
        return character ? await this.applyPassiveEffects(character) : undefined;
    }
    async findById(id) {
        this.logger.debug(`Finding character by ID: ${id}`);
        const character = await this.knex('characters')
            .where({ id: id })
            .first();
        return character ? await this.applyPassiveEffects(character) : undefined;
    }
    async getStoryInventory(progressId) {
        this.logger.debug(`Workspaceing inventory for story progress ID: ${progressId}`);
        return this.knex('character_story_inventory as csi')
            .join('items', 'items.id', 'csi.item_id')
            .where('csi.character_story_progress_id', progressId)
            .andWhere('csi.quantity', '>', 0)
            .select('items.id as itemId', 'items.name', 'items.description', 'items.type', 'items.effect', 'items.usable', 'csi.quantity');
    }
    async hasStoryItem(progressId, itemId, quantity = 1) {
        this.logger.debug(`Checking if story progress ID ${progressId} has item ${itemId} (quantity: ${quantity})`);
        const itemEntry = await this.knex('character_story_inventory')
            .where({
            character_story_progress_id: progressId,
            item_id: itemId,
        })
            .andWhere('quantity', '>=', quantity)
            .first();
        return !!itemEntry;
    }
    async addStoryItem(progressId, itemId, quantity = 1) {
        if (quantity <= 0)
            return;
        this.logger.log(`Adding item ${itemId} (quantity ${quantity}) to story progress ID: ${progressId}`);
        const existingEntry = await this.knex('character_story_inventory')
            .where({ character_story_progress_id: progressId, item_id: itemId })
            .first();
        if (existingEntry) {
            await this.knex('character_story_inventory')
                .where({ id: existingEntry.id })
                .increment('quantity', quantity)
                .update({ updated_at: new Date() });
            this.logger.debug(`Incremented quantity for item ${itemId} for progress ${progressId}`);
        }
        else {
            await this.knex('character_story_inventory').insert({
                character_story_progress_id: progressId,
                item_id: itemId,
                quantity: quantity,
            });
            this.logger.debug(`Inserted new item ${itemId} for progress ${progressId}`);
        }
    }
    async removeStoryItem(progressId, itemId, quantity = 1) {
        if (quantity <= 0)
            return true;
        this.logger.log(`Removing item ${itemId} (quantity ${quantity}) from story progress ID: ${progressId}`);
        const existingEntry = await this.knex('character_story_inventory')
            .where({ character_story_progress_id: progressId, item_id: itemId })
            .first();
        if (existingEntry && existingEntry.quantity >= quantity) {
            const newQuantity = existingEntry.quantity - quantity;
            if (newQuantity > 0) {
                await this.knex('character_story_inventory')
                    .where({ id: existingEntry.id })
                    .update({ quantity: newQuantity, updated_at: new Date() });
                this.logger.debug(`Decremented quantity for item ${itemId} to ${newQuantity} for progress ${progressId}`);
            }
            else {
                await this.knex('character_story_inventory')
                    .where({ id: existingEntry.id })
                    .del();
                this.logger.debug(`Removed item ${itemId} (quantity reached 0) for progress ${progressId}`);
            }
            return true;
        }
        else {
            this.logger.warn(`Failed to remove item ${itemId}: not enough quantity or item not found for progress ${progressId}.`);
            return false;
        }
    }
    async updateStoryProgress(progressId, updates) {
        this.logger.debug(`Updating story progress ID: ${progressId} with data: ${JSON.stringify(updates)}`);
        const finalUpdates = { ...updates, updated_at: new Date() };
        const [updatedRecord] = await this.knex('character_story_progress')
            .where({ id: progressId })
            .update(finalUpdates)
            .returning('*');
        if (!updatedRecord) {
            this.logger.error(`Failed to update story progress ${progressId}, record not found.`);
            throw new common_1.NotFoundException(`Story progress with ID ${progressId} not found for update.`);
        }
        this.logger.debug(`Story progress ${progressId} updated successfully.`);
        return updatedRecord;
    }
    async createCharacter(userId) {
        this.logger.log(`Creating new character for user ID: ${userId}.`);
        const defaultHealth = 100;
        const defaultSkill = 10;
        const defaultLuck = 5;
        const defaultStamina = 100;
        const defaultLevel = 1;
        const defaultXp = 0;
        const defaultXpToNextLevel = 100;
        try {
            const [newCharacter] = await this.knex('characters')
                .insert({
                user_id: userId,
                current_node_id: STARTING_NODE_ID,
                health: defaultHealth,
                skill: defaultSkill,
                luck: defaultLuck,
                stamina: defaultStamina,
                level: defaultLevel,
                xp: defaultXp,
                xp_to_next_level: defaultXpToNextLevel,
                name: 'Kalandor',
            })
                .returning('*');
            this.logger.log(`New character created with ID: ${newCharacter.id} for user ID: ${userId}`);
            await this.knex('player_progress').insert({
                character_id: newCharacter.id,
                node_id: STARTING_NODE_ID,
                choice_id_taken: null,
            });
            return newCharacter;
        }
        catch (error) {
            this.logger.error(`Failed to create character for user ${userId}: ${error}`, error.stack);
            throw new common_1.InternalServerErrorException('Could not create character.');
        }
    }
    async updateCharacter(characterId, updates) {
        this.logger.debug(`Updating character ID: ${characterId} with data: ${JSON.stringify(updates)}`);
        const [updatedCharacter] = await this.knex('characters')
            .where({ id: characterId })
            .update(updates)
            .returning('*');
        if (!updatedCharacter) {
            this.logger.error(`Failed to update character ${characterId}, character not found after update attempt.`);
            throw new common_1.NotFoundException(`Character with ID ${characterId} not found for update.`);
        }
        this.logger.debug(`Character ${characterId} updated successfully.`);
        return updatedCharacter;
    }
    async equipItem(characterId, itemId) {
        this.logger.log(`Character ${characterId} attempting to equip item ${itemId} for their active story.`);
        const activeStoryProgress = await this.getActiveStoryProgress(characterId);
        if (!activeStoryProgress) {
            throw new common_1.NotFoundException('No active story progress found for character to equip item.');
        }
        const progressId = activeStoryProgress.id;
        const hasItemInStoryInventory = await this.hasStoryItem(progressId, itemId);
        if (!hasItemInStoryInventory) {
            this.logger.warn(`Item ${itemId} not found in story inventory for progress ${progressId}.`);
            throw new common_1.BadRequestException(`You do not possess this item in the current story's inventory.`);
        }
        const item = await this.knex('items')
            .where({ id: itemId })
            .first();
        if (!item) {
            throw new common_1.InternalServerErrorException(`Item data for ID ${itemId} not found.`);
        }
        let equipSlotColumn = null;
        let updates = {};
        if (item.type === 'weapon') {
            equipSlotColumn = 'equipped_weapon_id';
            updates.equipped_weapon_id = itemId;
        }
        else if (item.type === 'armor') {
            equipSlotColumn = 'equipped_armor_id';
            updates.equipped_armor_id = itemId;
        }
        else {
            this.logger.warn(`Item ${itemId} (${item.name}) of type ${item.type} is not equippable.`);
            throw new common_1.BadRequestException(`Item ${item.name} is not equippable.`);
        }
        this.logger.debug(`Equipping item ${itemId} into slot ${equipSlotColumn} for story progress ${progressId}`);
        return this.updateStoryProgress(progressId, updates);
    }
    async unequipItem(characterId, itemType) {
        this.logger.log(`Character ${characterId} attempting to unequip item type ${itemType} for their active story.`);
        const activeStoryProgress = await this.getActiveStoryProgress(characterId);
        if (!activeStoryProgress) {
            throw new common_1.NotFoundException('No active story progress found for character to unequip item.');
        }
        const progressId = activeStoryProgress.id;
        let equipSlotColumn = null;
        let updates = {};
        if (itemType === 'weapon') {
            equipSlotColumn = 'equipped_weapon_id';
            updates.equipped_weapon_id = null;
        }
        else if (itemType === 'armor') {
            equipSlotColumn = 'equipped_armor_id';
            updates.equipped_armor_id = null;
        }
        else {
            throw new common_1.BadRequestException(`Invalid item type "${itemType}" for unequipping.`);
        }
        this.logger.debug(`Unequipping slot ${equipSlotColumn} for story progress ${progressId}`);
        return this.updateStoryProgress(progressId, updates);
    }
    async applyPassiveEffects(character) {
        const characterWithEffects = { ...character };
        characterWithEffects.defense = characterWithEffects.defense ?? 0;
        characterWithEffects.skill = characterWithEffects.skill ?? 0;
        characterWithEffects.luck = characterWithEffects.luck ?? 0;
        characterWithEffects.stamina = characterWithEffects.stamina ?? 100;
        this.logger.debug(`Applying passive effects for char ${character.id}. Base Skill: ${character.skill}, Base Defense: ${character.defense}`);
        const equippedItemIds = [
            character.equipped_weapon_id,
            character.equipped_armor_id,
        ].filter((id) => id !== null && id !== undefined);
        if (equippedItemIds.length > 0) {
            const equippedItems = await this.knex('items').whereIn('id', equippedItemIds);
            this.logger.debug(`Found ${equippedItems.length} equipped items to process effects.`);
            for (const item of equippedItems) {
                const isPassiveType = ['weapon', 'armor', 'ring', 'amulet'].includes(item.type?.toLowerCase() ?? '');
                if (isPassiveType &&
                    typeof item.effect === 'string' &&
                    item.effect.length > 0) {
                    this.logger.debug(`Parsing passive effect "${item.effect}" from equipped item ID: ${item.id} (Name: ${item.name})`);
                    const effects = item.effect.split(';');
                    for (const effectPart of effects) {
                        const effectRegex = /(\w+)\s*([+-])\s*(\d+)/;
                        const match = effectPart.trim().match(effectRegex);
                        if (match) {
                            const [, statName, operator, valueStr] = match;
                            const value = parseInt(valueStr, 10);
                            const modifier = operator === '+' ? value : -value;
                            this.logger.debug(`Parsed effect part: stat=${statName}, modifier=${modifier}`);
                            switch (statName.toLowerCase()) {
                                case 'skill':
                                    characterWithEffects.skill =
                                        (characterWithEffects.skill ?? 0) + modifier;
                                    break;
                                case 'luck':
                                    characterWithEffects.luck =
                                        (characterWithEffects.luck ?? 0) + modifier;
                                    break;
                                case 'stamina':
                                    characterWithEffects.stamina =
                                        (characterWithEffects.stamina ?? 0) + modifier;
                                    break;
                                case 'defense':
                                    characterWithEffects.defense =
                                        (characterWithEffects.defense ?? 0) + modifier;
                                    break;
                                default:
                                    this.logger.warn(`Unknown stat in passive effect: ${statName}`);
                                    break;
                            }
                        }
                        else {
                            this.logger.warn(`Could not parse passive effect part: "${effectPart}"`);
                        }
                    }
                }
            }
            this.logger.log(`Effects applied. Final stats: Skill=${characterWithEffects.skill}, Def=${characterWithEffects.defense}, Luck=${characterWithEffects.luck}, Stamina=${characterWithEffects.stamina}`);
        }
        else {
            this.logger.debug('No items equipped, no passive effects to apply.');
        }
        return characterWithEffects;
    }
    async resetStoryProgress(characterId, storyId) {
        this.logger.log(`Attempting to reset story progress for Character ID: ${characterId}, Story ID: ${storyId}`);
        await this.knex.transaction(async (trx) => {
            const progressToReset = await trx('character_story_progress')
                .where({
                character_id: characterId,
                story_id: storyId,
            })
                .first('id');
            if (progressToReset && progressToReset.id) {
                const progressId = progressToReset.id;
                this.logger.debug(`Found story progress record ID: ${progressId} for character ${characterId}, story ${storyId}. Proceeding with reset.`);
                const deletedPlayerProgress = await trx('player_progress')
                    .where({ character_story_progress_id: progressId })
                    .del();
                this.logger.debug(`Deleted ${deletedPlayerProgress} entries from player_progress for progress ID: ${progressId}`);
                const deletedInventoryItems = await trx('character_story_inventory')
                    .where({ character_story_progress_id: progressId })
                    .del();
                this.logger.debug(`Deleted ${deletedInventoryItems} items from character_story_inventory for progress ID: ${progressId}`);
                const deletedStoryProgress = await trx('character_story_progress')
                    .where({ id: progressId })
                    .del();
                if (deletedStoryProgress > 0) {
                    this.logger.log(`Successfully reset story progress ID: ${progressId} for character ${characterId}, story ${storyId}.`);
                }
                else {
                    this.logger.warn(`Story progress ID: ${progressId} was targeted for deletion but not found or not deleted.`);
                }
            }
            else {
                this.logger.warn(`No story progress found for Character ID: ${characterId} and Story ID: ${storyId}. Nothing to reset.`);
            }
        });
    }
    async addXp(characterId, xpToAdd) {
        if (xpToAdd <= 0) {
            return { leveledUp: false, messages: [] };
        }
        this.logger.log(`[CharacterService.addXp] Attempting to add ${xpToAdd} XP for baseCharacterId ${characterId}`);
        const activeStoryProgress = await this.getActiveStoryProgress(characterId);
        if (!activeStoryProgress) {
            this.logger.warn(`[CharacterService.addXp] No active story progress found for character ${characterId} to add XP to.`);
            return {
                leveledUp: false,
                messages: ['Nincs aktív sztori, amihez XP-t lehetne adni.'],
            };
        }
        this.logger.debug(`[CharacterService.addXp] Found active story progress ID: ${activeStoryProgress.id}. Current Lvl: ${activeStoryProgress.level}, XP: ${activeStoryProgress.xp}/${activeStoryProgress.xp_to_next_level}`);
        let currentXp = activeStoryProgress.xp + xpToAdd;
        let currentLevel = activeStoryProgress.level;
        let currentXpToNext = activeStoryProgress.xp_to_next_level;
        let currentTalentPoints = activeStoryProgress.talent_points_available ?? 0;
        let currentStamina = activeStoryProgress.stamina;
        let currentHealth = activeStoryProgress.health;
        let leveledUp = false;
        const levelUpMessages = [];
        const pointsPerLevel = 3;
        const staminaIncreasePerLevel = 10;
        while (currentXp >= currentXpToNext) {
            leveledUp = true;
            currentLevel++;
            const xpOver = currentXp - currentXpToNext;
            currentXp = xpOver;
            currentXpToNext = Math.floor(100 * Math.pow(1.5, currentLevel - 1));
            currentStamina += staminaIncreasePerLevel;
            currentHealth = currentStamina;
            levelUpMessages.push(`Állóképességed (Stamina/MaxHP) nőtt +${staminaIncreasePerLevel}-el! Jelenlegi: ${currentStamina}. Életerőd teljesen visszatöltődött!`);
            currentTalentPoints += pointsPerLevel;
            levelUpMessages.push(`SZINTLÉPÉS! Elérted a ${currentLevel}. szintet! Kaptál ${pointsPerLevel} tehetségpontot.`);
            this.logger.log(`StoryProgress ${activeStoryProgress.id} leveled up to ${currentLevel}. Gained ${pointsPerLevel} talent points. Stamina increased by ${staminaIncreasePerLevel}.`);
        }
        const updates = {
            level: currentLevel,
            xp: currentXp,
            xp_to_next_level: currentXpToNext,
            talent_points_available: currentTalentPoints,
            stamina: currentStamina,
            health: currentHealth,
        };
        this.logger.debug(`[CharacterService.addXp] Updating story progress ID ${activeStoryProgress.id} with: ${JSON.stringify(updates)}`);
        const updatedProgressRecord = await this.updateStoryProgress(activeStoryProgress.id, updates);
        return {
            leveledUp,
            messages: levelUpMessages,
            updatedProgress: updatedProgressRecord,
        };
    }
    async getActiveStoryProgress(characterId) {
        this.logger.debug(`Workspaceing active story progress for character ID: ${characterId}`);
        const progress = await this.knex('character_story_progress')
            .where({ character_id: characterId, is_active: true })
            .first();
        return progress || null;
    }
    async startOrContinueStory(characterId, storyId) {
        this.logger.log(`Character ${characterId} starting/continuing story ID: ${storyId}`);
        const story = await this.knex('stories')
            .where({ id: storyId })
            .first();
        if (!story) {
            this.logger.warn(`Story with ID ${storyId} not found.`);
            throw new common_1.NotFoundException(`Story with ID ${storyId} not found.`);
        }
        if (!story.is_published) {
            this.logger.warn(`Story with ID ${storyId} is not published.`);
            throw new common_1.ForbiddenException(`Story with ID ${storyId} is not available.`);
        }
        const startingNodeId = story.starting_node_id;
        const progressRecord = await this.knex.transaction(async (trx) => {
            this.logger.debug(`Clearing any existing active combat for character ${characterId} within transaction.`);
            await trx('active_combats')
                .where({ character_id: characterId })
                .del();
            await trx('character_story_progress')
                .where({ character_id: characterId, is_active: true })
                .andWhereNot({ story_id: storyId })
                .update({ is_active: false, updated_at: new Date() });
            let existingProgress = await trx('character_story_progress')
                .where({ character_id: characterId, story_id: storyId })
                .first();
            let finalProgressRecord;
            if (existingProgress) {
                this.logger.log(`Continuing existing progress for story ${storyId} for character ${characterId}`);
                const updatedRows = await trx('character_story_progress')
                    .where({ id: existingProgress.id })
                    .update({
                    is_active: true,
                    last_played_at: new Date(),
                    updated_at: new Date(),
                })
                    .returning('*');
                if (!updatedRows?.[0]) {
                    this.logger.error(`Failed to update or retrieve character_story_progress for id ${existingProgress.id}.`);
                    throw new common_1.InternalServerErrorException('Failed to update story progress.');
                }
                finalProgressRecord = updatedRows[0];
            }
            else {
                this.logger.log(`Creating new progress for story ${storyId} for character ${characterId}`);
                const baseCharData = await trx('characters')
                    .where({ id: characterId })
                    .select('selected_archetype_id')
                    .first();
                let archetypeBonuses = {};
                let startingAbilities = [];
                if (baseCharData?.selected_archetype_id) {
                }
                const insertedRows = await trx('character_story_progress')
                    .insert({
                    character_id: characterId,
                    story_id: storyId,
                    current_node_id: startingNodeId,
                    health: DEFAULT_HEALTH + (archetypeBonuses.base_health_bonus || 0),
                    skill: DEFAULT_SKILL + (archetypeBonuses.base_skill_bonus || 0),
                    luck: DEFAULT_LUCK + (archetypeBonuses.base_luck_bonus || 0),
                    stamina: DEFAULT_STAMINA + (archetypeBonuses.base_stamina_bonus || 0),
                    defense: DEFAULT_DEFENSE + (archetypeBonuses.base_defense_bonus || 0),
                    level: DEFAULT_LEVEL,
                    xp: DEFAULT_XP,
                    xp_to_next_level: DEFAULT_XP_TO_NEXT_LEVEL,
                    is_active: true,
                })
                    .returning('*');
                if (!insertedRows?.[0]) {
                    this.logger.error(`Failed to insert/retrieve new character_story_progress for char ${characterId}, story ${storyId}.`);
                    throw new common_1.InternalServerErrorException('Failed to create new story progress.');
                }
                finalProgressRecord = insertedRows[0];
                await trx('player_progress').insert({
                    character_story_progress_id: finalProgressRecord.id,
                    node_id: startingNodeId,
                    choice_id_taken: null,
                });
                this.logger.debug(`Initial player_progress logged for new story progress ${finalProgressRecord.id}`);
                if (startingAbilities.length > 0) {
                    const abilitiesToInsert = startingAbilities.map((abilityId) => ({
                        character_story_progress_id: finalProgressRecord.id,
                        ability_id: abilityId,
                    }));
                    await trx('character_story_abilities')
                        .insert(abilitiesToInsert)
                        .onConflict()
                        .ignore();
                    this.logger.debug(`Added/ignored starting abilities for progress ${finalProgressRecord.id}`);
                }
            }
            this.logger.debug('[startOrContinueStory] Progress before returning from transaction:', JSON.stringify(finalProgressRecord, null, 2));
            return finalProgressRecord;
        });
        if (!progressRecord) {
            throw new common_1.InternalServerErrorException('Transaction failed to return a progress record.');
        }
        this.logger.debug('[startOrContinueStory] Progress record after transaction:', JSON.stringify(progressRecord, null, 2));
        return progressRecord;
    }
    async spendTalentPointOnStat(characterId, statName) {
        this.logger.log(`Character ${characterId} attempting to spend 1 talent point on stat: ${statName}`);
        const activeStoryProgress = await this.getActiveStoryProgress(characterId);
        if (!activeStoryProgress) {
            throw new common_1.NotFoundException('No active story progress found for character to spend talent points.');
        }
        if ((activeStoryProgress.talent_points_available ?? 0) < 1) {
            this.logger.warn(`Character progress ${activeStoryProgress.id} has no talent points available.`);
            throw new common_1.BadRequestException('Nincs elkölthető tehetségpontod.');
        }
        const pointsToDecrease = 1;
        const currentStatValue = activeStoryProgress[statName] ?? 0;
        const increaseAmount = STAT_INCREASE_PER_TALENT_POINT[statName];
        if (increaseAmount === undefined) {
            this.logger.error(`Invalid statName "${statName}" provided for spending talent point.`);
            throw new common_1.BadRequestException(`Érvénytelen statisztika: ${statName}`);
        }
        const newStatValue = currentStatValue + increaseAmount;
        const newTalentPointsAvailable = (activeStoryProgress.talent_points_available ?? 0) - pointsToDecrease;
        const updates = {
            [statName]: newStatValue,
            talent_points_available: newTalentPointsAvailable,
        };
        if (statName === 'stamina') {
            updates.health = newStatValue;
            this.logger.log(`Stamina increased to ${newStatValue}, health refilled to ${newStatValue}.`);
        }
        this.logger.debug(`Updating story progress ${activeStoryProgress.id} after spending talent point. Updates: ${JSON.stringify(updates)}`);
        return this.updateStoryProgress(activeStoryProgress.id, updates);
    }
    async findOrCreateByUserId(userId) {
        let character = await this.knex('characters')
            .where({ user_id: userId })
            .first();
        if (!character) {
            this.logger.log(`No character for user ID ${userId}. Creating new base character.`);
            const [newCharacter] = await this.knex('characters')
                .insert({ user_id: userId, name: 'Kalandor', role: 'player' })
                .returning('*');
            character = newCharacter;
        }
        if (!character)
            throw new common_1.InternalServerErrorException('Failed to find or create base character.');
        return character;
    }
    async setActiveStory(characterId, storyId) {
        this.logger.log(`Character ${characterId} attempting to set story ID: ${storyId} as active.`);
        await this.knex.transaction(async (trx) => {
            await trx('character_story_progress')
                .where({ character_id: characterId, is_active: true })
                .andWhereNot({ story_id: storyId })
                .update({ is_active: false, updated_at: new Date() });
            const [updatedRow] = await trx('character_story_progress')
                .where({ character_id: characterId, story_id: storyId })
                .update({ is_active: true, last_played_at: new Date() })
                .returning('*');
            if (!updatedRow) {
                this.logger.log(`No existing progress for story ${storyId}, character ${characterId}. New playthrough needed.`);
                return null;
            }
            this.logger.log(`Story progress ${updatedRow.id} activated for story ${storyId}, character ${characterId}.`);
            return updatedRow;
        });
        const progress = await this.getActiveStoryProgress(characterId);
        return progress && progress.story_id === storyId ? progress : null;
    }
    async beginNewStoryPlaythrough(characterId, storyId, archetypeId) {
        this.logger.log(`Character ${characterId} beginning new playthrough for story ${storyId} with archetype ${archetypeId}`);
        const story = await this.knex('stories')
            .where({ id: storyId, is_published: true })
            .first();
        if (!story)
            throw new common_1.NotFoundException(`Published story with ID ${storyId} not found.`);
        const archetype = await this.knex('character_archetypes')
            .where({ id: archetypeId })
            .first();
        if (!archetype)
            throw new common_1.NotFoundException(`Archetype with ID ${archetypeId} not found.`);
        await this.knex('character_story_progress')
            .where({ character_id: characterId, is_active: true })
            .update({ is_active: false, updated_at: new Date() });
        const startingNodeId = story.starting_node_id;
        const archetypeBonuses = {
            health: archetype.base_health_bonus || 0,
            skill: archetype.base_skill_bonus || 0,
            luck: archetype.base_luck_bonus || 0,
            stamina: archetype.base_stamina_bonus || 0,
            defense: archetype.base_defense_bonus || 0,
        };
        const [newProgress] = await this.knex('character_story_progress')
            .insert({
            character_id: characterId,
            story_id: storyId,
            selected_archetype_id: archetypeId,
            current_node_id: startingNodeId,
            health: DEFAULT_HEALTH + archetypeBonuses.health,
            skill: DEFAULT_SKILL + archetypeBonuses.skill,
            luck: DEFAULT_LUCK + archetypeBonuses.luck,
            stamina: DEFAULT_STAMINA + archetypeBonuses.stamina,
            defense: DEFAULT_DEFENSE + archetypeBonuses.defense,
            level: DEFAULT_LEVEL,
            xp: DEFAULT_XP,
            xp_to_next_level: DEFAULT_XP_TO_NEXT_LEVEL,
            is_active: true,
            last_played_at: new Date(),
        })
            .returning('*');
        if (!newProgress)
            throw new common_1.InternalServerErrorException('Failed to create new story progress.');
        const startingAbilities = archetype.starting_ability_ids || [];
        if (startingAbilities.length > 0) {
            const abilitiesToInsert = startingAbilities.map((abilityId) => ({
                character_story_progress_id: newProgress.id,
                ability_id: abilityId,
            }));
            await this.knex('character_story_abilities')
                .insert(abilitiesToInsert)
                .onConflict()
                .ignore();
        }
        await this.knex('player_progress').insert({
            character_story_progress_id: newProgress.id,
            node_id: startingNodeId,
            choice_id_taken: null,
        });
        this.logger.log(`New playthrough (ProgressID: ${newProgress.id}) started for story ${storyId}, char ${characterId} with archetype ${archetypeId}`);
        return newProgress;
    }
    async getSelectableArchetypes() {
        this.logger.log('Fetching selectable character archetypes for players with ability details');
        try {
            const archetypes = await this.knex('character_archetypes')
                .select('*')
                .orderBy('name', 'asc');
            const result = [];
            for (const arch of archetypes) {
                let abilitiesDetails = [];
                if (arch.starting_ability_ids && arch.starting_ability_ids.length > 0) {
                    const abilities = await this.knex('abilities')
                        .whereIn('id', arch.starting_ability_ids)
                        .select('id', 'name', 'description');
                    abilitiesDetails = abilities.map((a) => ({
                        id: a.id,
                        name: a.name,
                        description: a.description,
                    }));
                }
                result.push({
                    id: arch.id,
                    name: arch.name,
                    description: arch.description,
                    iconPath: arch.icon_path,
                    baseHealthBonus: arch.base_health_bonus,
                    baseSkillBonus: arch.base_skill_bonus,
                    baseLuckBonus: arch.base_luck_bonus,
                    baseStaminaBonus: arch.base_stamina_bonus,
                    baseDefenseBonus: arch.base_defense_bonus,
                    startingAbilities: abilitiesDetails,
                });
            }
            return result;
        }
        catch (error) {
            this.logger.error('Failed to fetch selectable archetypes with abilities', error.stack);
            throw new common_1.InternalServerErrorException('Could not retrieve character archetypes.');
        }
    }
    async selectArchetypeForCharacter(characterId, archetypeId) {
        this.logger.log(`Character ${characterId} attempting to select archetype ID: ${archetypeId}`);
        const archetypeExists = await this.knex('character_archetypes')
            .where({ id: archetypeId })
            .first();
        if (!archetypeExists) {
            this.logger.warn(`Attempted to select non-existent archetype ID: ${archetypeId} for character ${characterId}`);
            throw new common_1.NotFoundException(`Archetype with ID ${archetypeId} not found.`);
        }
        const [updatedCharacter] = await this.knex('characters')
            .where({ id: characterId })
            .update({
            selected_archetype_id: archetypeId,
            updated_at: new Date(),
        })
            .returning('*');
        if (!updatedCharacter) {
            this.logger.error(`Failed to update archetype for character ID ${characterId}. Character not found.`);
            throw new common_1.NotFoundException(`Character with ID ${characterId} not found for archetype update.`);
        }
        this.logger.log(`Character ${characterId} successfully selected archetype ID: ${archetypeId}`);
        return updatedCharacter;
    }
};
exports.CharacterService = CharacterService;
exports.CharacterService = CharacterService = CharacterService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(database_module_1.KNEX_CONNECTION)),
    __metadata("design:paramtypes", [Function])
], CharacterService);
//# sourceMappingURL=character.service.js.map