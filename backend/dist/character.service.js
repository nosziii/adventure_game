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
    async applyPassiveEffects(character) {
        const characterWithEffects = { ...character };
        const inventory = await this.getInventory(character.id);
        this.logger.debug(`Applying passive effects for character ${character.id}. Inventory size: ${inventory.length}`);
        for (const item of inventory) {
            const isPassiveType = ['weapon', 'armor', 'ring', 'amulet'].includes(item.type?.toLowerCase() ?? '');
            if (isPassiveType && typeof item.effect === 'string' && item.effect.length > 0) {
                this.logger.debug(`Parsing passive effect "${item.effect}" from item ${item.itemId} (${item.name})`);
                const effectRegex = /(\w+)\s*([+-])\s*(\d+)/;
                const match = item.effect.match(effectRegex);
                if (match) {
                    const [, statName, operator, valueStr] = match;
                    const value = parseInt(valueStr, 10);
                    const modifier = operator === '+' ? value : -value;
                    this.logger.debug(`Parsed effect: stat=${statName}, modifier=${modifier}`);
                    switch (statName.toLowerCase()) {
                        case 'skill':
                            characterWithEffects.skill = (characterWithEffects.skill ?? 0) + modifier;
                            this.logger.log(`Applied effect: skill changed to ${characterWithEffects.skill}`);
                            break;
                        case 'health':
                            this.logger.warn(`Passive health effect found, but max health handling not implemented.`);
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
                    this.logger.warn(`Could not parse passive effect string: "${item.effect}"`);
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
};
exports.CharacterService = CharacterService;
exports.CharacterService = CharacterService = CharacterService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(database_module_1.KNEX_CONNECTION)),
    __metadata("design:paramtypes", [Function])
], CharacterService);
//# sourceMappingURL=character.service.js.map