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
        return this.knex('characters')
            .where({ user_id: userId })
            .first();
    }
    async findById(id) {
        this.logger.debug(`Finding character by ID: ${id}`);
        return this.knex('characters')
            .where({ id: id })
            .first();
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
};
exports.CharacterService = CharacterService;
exports.CharacterService = CharacterService = CharacterService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(database_module_1.KNEX_CONNECTION)),
    __metadata("design:paramtypes", [Function])
], CharacterService);
//# sourceMappingURL=character.service.js.map