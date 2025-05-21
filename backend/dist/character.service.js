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
    async findOrCreateByUserId(userId) {
        let character = await this.findByUserId(userId);
        if (!character) {
            this.logger.log(`Character not found for user ${userId} in findOrCreate, creating new one.`);
            const baseCharacter = await this.createCharacter(userId);
            character = await this.applyPassiveEffects(baseCharacter);
        }
        return character;
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
    async addXp(characterId, xpToAdd) {
        if (xpToAdd <= 0) {
            return { leveledUp: false, messages: [] };
        }
        this.logger.log(`Attempting to add ${xpToAdd} XP to character ${characterId}`);
        const character = await this.findById(characterId);
        if (!character) {
            this.logger.error(`Cannot add XP, character ${characterId} not found.`);
            throw new common_1.NotFoundException('Character not found to add XP.');
        }
        let currentXp = character.xp + xpToAdd;
        let currentLevel = character.level;
        let currentXpToNext = character.xp_to_next_level;
        let currentSkill = character.skill ?? 0;
        let currentLuck = character.luck ?? 0;
        let currentStamina = character.stamina ?? 100;
        let currentHealth = character.health;
        let leveledUp = false;
        const levelUpMessages = [];
        while (currentXp >= currentXpToNext) {
            leveledUp = true;
            currentLevel++;
            const xpOver = currentXp - currentXpToNext;
            currentXp = xpOver;
            const newXpToNext = Math.floor(100 * Math.pow(1.5, currentLevel - 1));
            currentXpToNext = newXpToNext;
            const skillIncrease = 1;
            const luckIncrease = 2;
            const staminaIncrease = 10;
            currentSkill += skillIncrease;
            currentLuck += luckIncrease;
            currentStamina += staminaIncrease;
            currentHealth = currentStamina;
            const levelUpMsg = `SZINTLÉPÉS! Elérted a ${currentLevel}. szintet! Skill+${skillIncrease}, Luck+${luckIncrease}, Stamina+${staminaIncrease}. Életerő visszatöltve!`;
            this.logger.log(`Character ${characterId} leveled up to ${currentLevel}.`);
            levelUpMessages.push(levelUpMsg);
        }
        try {
            const updates = {
                level: currentLevel,
                xp: currentXp,
                xp_to_next_level: currentXpToNext,
                skill: currentSkill,
                luck: currentLuck,
                stamina: currentStamina,
                health: currentHealth,
            };
            await this.updateCharacter(characterId, updates);
            this.logger.log(`Character ${characterId} XP/Level/Stats updated.`);
            return { leveledUp, messages: levelUpMessages };
        }
        catch (error) {
            this.logger.error(`Failed to update character ${characterId} after XP gain/level up: ${error}`, error.stack);
            throw new common_1.InternalServerErrorException('Failed to save character progression.');
        }
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
            this.logger.debug(`Clearing any existing active combat for character ${characterId} before starting/continuing story ${storyId}`);
            await trx('active_combats').where({ character_id: characterId }).del();
            await trx('character_story_progress')
                .where({ character_id: characterId, is_active: true })
                .andWhereNot({ story_id: storyId })
                .update({ is_active: false, updated_at: new Date() });
            let currentProgress = await trx('character_story_progress')
                .where({ character_id: characterId, story_id: storyId })
                .first();
            if (currentProgress) {
                this.logger.log(`Continuing existing progress for story ${storyId} for character ${characterId}`);
                const updatedRows = await trx('character_story_progress')
                    .where({ id: currentProgress.id })
                    .update({
                    is_active: true,
                    last_played_at: new Date(),
                    updated_at: new Date(),
                })
                    .returning('*');
                if (!updatedRows || updatedRows.length === 0 || !updatedRows[0]) {
                    this.logger.error(`Failed to update or retrieve character_story_progress for id ${currentProgress.id}.`);
                    throw new common_1.InternalServerErrorException('Failed to update story progress.');
                }
                currentProgress = updatedRows[0];
            }
            else {
                this.logger.log(`Creating new progress for story ${storyId} for character ${characterId}`);
                const insertedRows = await trx('character_story_progress')
                    .insert({
                    character_id: characterId,
                    story_id: storyId,
                    current_node_id: startingNodeId,
                    health: DEFAULT_HEALTH,
                    skill: DEFAULT_SKILL,
                    luck: DEFAULT_LUCK,
                    stamina: DEFAULT_STAMINA,
                    defense: DEFAULT_DEFENSE,
                    level: DEFAULT_LEVEL,
                    xp: DEFAULT_XP,
                    xp_to_next_level: DEFAULT_XP_TO_NEXT_LEVEL,
                    is_active: true,
                })
                    .returning('*');
                if (!insertedRows || insertedRows.length === 0 || !insertedRows[0]) {
                    this.logger.error(`Failed to insert or retrieve new character_story_progress for char ${characterId}, story ${storyId}.`);
                    throw new common_1.InternalServerErrorException('Failed to create new story progress.');
                }
                currentProgress = insertedRows[0];
                await trx('player_progress').insert({
                    character_story_progress_id: currentProgress?.id ??
                        (() => {
                            throw new common_1.InternalServerErrorException('currentProgress is undefined.');
                        })(),
                    node_id: startingNodeId,
                    choice_id_taken: null,
                });
                this.logger.debug(`Initial player_progress logged for new story progress ${currentProgress.id}`);
            }
            this.logger.debug('[startOrContinueStory] Progress before returning from transaction:', JSON.stringify(currentProgress, null, 2));
            return currentProgress;
        });
        if (!progressRecord) {
            throw new common_1.InternalServerErrorException('Failed to retrieve story progress.');
        }
        this.logger.debug('[startOrContinueStory] Progress record after transaction:', JSON.stringify(progressRecord, null, 2));
        return progressRecord;
    }
    async resetStoryProgress(characterId, storyId) {
        this.logger.log(`Character ${characterId} attempting to reset progress for story ID: ${storyId}`);
        await this.knex.transaction(async (trx) => {
            const progress = await trx('character_story_progress')
                .where({ character_id: characterId, story_id: storyId })
                .first('id');
            if (progress && progress.id) {
                const progressId = progress.id;
                this.logger.debug(`Found story progress ID: ${progressId} to reset.`);
                await trx('player_progress')
                    .where({ character_story_progress_id: progressId })
                    .del();
                this.logger.debug(`Deleted player_progress entries for progress ID: ${progressId}`);
                await trx('character_story_inventory')
                    .where({ character_story_progress_id: progressId })
                    .del();
                this.logger.debug(`Deleted character_story_inventory entries for progress ID: ${progressId}`);
                await trx('character_story_progress').where({ id: progressId }).del();
                this.logger.log(`Story progress ID: ${progressId} has been reset for character ${characterId}.`);
            }
            else {
                this.logger.warn(`No story progress found for character ${characterId} and story ${storyId} to reset.`);
            }
        });
    }
};
exports.CharacterService = CharacterService;
exports.CharacterService = CharacterService = CharacterService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(database_module_1.KNEX_CONNECTION)),
    __metadata("design:paramtypes", [Function])
], CharacterService);
//# sourceMappingURL=character.service.js.map