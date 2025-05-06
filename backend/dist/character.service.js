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
    async createCharacter(userId) {
        this.logger.log(`Creating new character for user ID: ${userId}.`);
        const defaultHealth = 100;
        const defaultSkill = 10;
        const defaultLuck = 5;
        const defaultStamina = 100;
        try {
            const [newCharacter] = await this.knex('characters')
                .insert({
                user_id: userId,
                current_node_id: STARTING_NODE_ID,
                health: defaultHealth,
                skill: defaultSkill,
                luck: defaultLuck,
                stamina: defaultStamina,
                name: 'Kalandor',
            })
                .returning('*');
            this.logger.log(`New character created with ID: ${newCharacter.id} for user ID: ${userId}`);
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
    async getInventory(characterId) {
        this.logger.debug(`Workspaceing inventory for character ID: ${characterId}`);
        try {
            const inventory = await this.knex('character_inventory as ci')
                .join('items as i', 'ci.item_id', '=', 'i.id')
                .select('ci.item_id as itemId', 'ci.quantity', 'i.name', 'i.description', 'i.type', 'i.effect', 'i.usable')
                .where('ci.character_id', characterId);
            return inventory;
        }
        catch (error) {
            this.logger.error(`Failed to fetch inventory for character ${characterId}: ${error}`, error.stack);
            throw new common_1.InternalServerErrorException('Could not retrieve inventory.');
        }
    }
    async equipItem(characterId, itemId) {
        this.logger.log(`Attempting to equip item ${itemId} for character ${characterId}`);
        const hasItemInInventory = await this.hasItem(characterId, itemId);
        if (!hasItemInInventory) {
            throw new common_1.BadRequestException(`Character ${characterId} does not possess item ${itemId}.`);
        }
        const item = await this.knex('items').where({ id: itemId }).first();
        if (!item) {
            throw new common_1.InternalServerErrorException('Item data not found.');
        }
        let equipSlotColumn = null;
        let updateData = {};
        if (item.type === 'weapon') {
            equipSlotColumn = 'equipped_weapon_id';
            updateData.equipped_weapon_id = itemId;
        }
        else if (item.type === 'armor') {
            equipSlotColumn = 'equipped_armor_id';
            updateData.equipped_armor_id = itemId;
        }
        if (!equipSlotColumn) {
            throw new common_1.BadRequestException(`Item ${itemId} (${item.name}) is not equippable.`);
        }
        try {
            this.logger.debug(`Equipping item ${itemId} into slot ${equipSlotColumn} for character ${characterId}`);
            const updatedCharacter = await this.updateCharacter(characterId, updateData);
            this.logger.log(`Item ${itemId} equipped successfully for character ${characterId}`);
            return await this.applyPassiveEffects(updatedCharacter);
        }
        catch (error) {
            this.logger.error(`Failed to equip item ${itemId} for character ${characterId}: ${error}`, error.stack);
            if (error instanceof common_1.NotFoundException || error instanceof common_1.InternalServerErrorException) {
                throw error;
            }
            throw new common_1.InternalServerErrorException('Failed to equip item due to an unexpected error.');
        }
    }
    async unequipItem(characterId, itemType) {
        this.logger.log(`Attempting to unequip item type ${itemType} for character ${characterId}`);
        let equipSlotColumn = null;
        let updateData = {};
        if (itemType === 'weapon') {
            equipSlotColumn = 'equipped_weapon_id';
            updateData.equipped_weapon_id = null;
        }
        else if (itemType === 'armor') {
            equipSlotColumn = 'equipped_armor_id';
            updateData.equipped_armor_id = null;
        }
        if (!equipSlotColumn) {
            throw new common_1.BadRequestException(`Invalid item type "${itemType}" for unequipping.`);
        }
        try {
            this.logger.debug(`Unequipping slot ${equipSlotColumn} for character ${characterId}`);
            const updatedCharacter = await this.updateCharacter(characterId, updateData);
            this.logger.log(`Item type ${itemType} unequipped successfully for character ${characterId}`);
            return await this.applyPassiveEffects(updatedCharacter);
        }
        catch (error) {
            this.logger.error(`Failed to unequip item type ${itemType} for character ${characterId}: ${error}`, error.stack);
            if (error instanceof common_1.NotFoundException || error instanceof common_1.InternalServerErrorException) {
                throw error;
            }
            throw new common_1.InternalServerErrorException('Failed to unequip item due to an unexpected error.');
        }
    }
    async applyPassiveEffects(character) {
        const characterWithEffects = { ...character };
        this.logger.debug(`Applying passive effects for character ${character.id}. WeaponID: ${character.equipped_weapon_id}, ArmorID: ${character.equipped_armor_id}`);
        const equippedItemIds = [character.equipped_weapon_id, character.equipped_armor_id]
            .filter((id) => id !== null && id !== undefined);
        if (equippedItemIds.length === 0) {
            this.logger.debug('No items equipped, no passive effects to apply.');
            return characterWithEffects;
        }
        const equippedItems = await this.knex('items').whereIn('id', equippedItemIds);
        for (const item of equippedItems) {
            const isPassiveType = ['weapon', 'armor', 'ring', 'amulet'].includes(item.type?.toLowerCase() ?? '');
            if (isPassiveType && typeof item.effect === 'string' && item.effect.length > 0) {
                this.logger.debug(`Parsing passive effect "${item.effect}" from equipped item ${item.id} (${item.name})`);
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
                                characterWithEffects.skill = (characterWithEffects.skill ?? 0) + modifier;
                                this.logger.log(`Applied effect: skill changed to ${characterWithEffects.skill}`);
                                break;
                            case 'luck':
                                characterWithEffects.luck = (characterWithEffects.luck ?? 0) + modifier;
                                this.logger.log(`Applied effect: luck changed to ${characterWithEffects.luck}`);
                                break;
                            case 'stamina':
                                characterWithEffects.stamina = (characterWithEffects.stamina ?? 0) + modifier;
                                this.logger.log(`Applied effect: stamina changed to ${characterWithEffects.stamina}`);
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
        return characterWithEffects;
    }
    async hasItem(characterId, itemId) {
        this.logger.debug(`Checking if character ${characterId} has item ${itemId}`);
        const itemEntry = await this.knex('character_inventory')
            .where({
            character_id: characterId,
            item_id: itemId,
        })
            .andWhere('quantity', '>', 0)
            .first();
        return !!itemEntry;
    }
    async addItemToInventory(characterId, itemId, quantityToAdd = 1) {
        if (quantityToAdd <= 0) {
            this.logger.warn(`Attempted to add non-positive quantity (${quantityToAdd}) of item ${itemId} for character ${characterId}`);
            return;
        }
        this.logger.log(`Adding item ${itemId} (quantity: ${quantityToAdd}) to inventory for character ${characterId}`);
        await this.knex.transaction(async (trx) => {
            const existingEntry = await trx('character_inventory')
                .where({ character_id: characterId, item_id: itemId })
                .first();
            if (existingEntry) {
                this.logger.debug(`Item ${itemId} exists, incrementing quantity by ${quantityToAdd}.`);
                const affectedRows = await trx('character_inventory')
                    .where({ character_id: characterId, item_id: itemId })
                    .increment('quantity', quantityToAdd);
                if (affectedRows === 0) {
                    throw new Error('Failed to increment item quantity.');
                }
            }
            else {
                this.logger.debug(`Item ${itemId} not found, inserting new entry.`);
                await trx('character_inventory')
                    .insert({
                    character_id: characterId,
                    item_id: itemId,
                    quantity: quantityToAdd,
                });
            }
        });
        this.logger.log(`Item ${itemId} successfully added/updated for character ${characterId}`);
    }
    async removeItemFromInventory(characterId, itemId, quantityToRemove = 1) {
        if (quantityToRemove <= 0)
            return true;
        this.logger.log(`Removing item ${itemId} (quantity: ${quantityToRemove}) from inventory for character ${characterId}`);
        let success = false;
        await this.knex.transaction(async (trx) => {
            const existingEntry = await trx('character_inventory')
                .where({ character_id: characterId, item_id: itemId })
                .forUpdate()
                .first();
            if (existingEntry && existingEntry.quantity >= quantityToRemove) {
                const newQuantity = existingEntry.quantity - quantityToRemove;
                if (newQuantity > 0) {
                    this.logger.debug(`Decreasing quantity of item ${itemId} to ${newQuantity}`);
                    await trx('character_inventory')
                        .where({ character_id: characterId, item_id: itemId })
                        .update({ quantity: newQuantity });
                }
                else {
                    this.logger.debug(`Removing item ${itemId} completely (quantity reached zero).`);
                    await trx('character_inventory')
                        .where({ character_id: characterId, item_id: itemId })
                        .del();
                }
                success = true;
            }
            else {
                this.logger.warn(`Failed to remove item ${itemId}: Not found or insufficient quantity for character ${characterId}.`);
                success = false;
            }
        });
        return success;
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
                health: currentHealth
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
};
exports.CharacterService = CharacterService;
exports.CharacterService = CharacterService = CharacterService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(database_module_1.KNEX_CONNECTION)),
    __metadata("design:paramtypes", [Function])
], CharacterService);
//# sourceMappingURL=character.service.js.map