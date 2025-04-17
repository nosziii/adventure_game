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
    async getCurrentGameState(userId) {
        this.logger.log(`Workspaceing game state for user ID: ${userId}`);
        let character = await this.characterService.findByUserId(userId);
        if (!character) {
            character = await this.characterService.createCharacter(userId);
        }
        let currentNodeId = character.current_node_id ?? STARTING_NODE_ID;
        if (character.current_node_id !== currentNodeId) {
            this.logger.warn(`Character ${character.id} had null current_node_id, setting to STARTING_NODE_ID ${STARTING_NODE_ID}`);
            character = await this.characterService.updateCharacter(character.id, { current_node_id: currentNodeId });
        }
        this.logger.debug(`Workspaceing story node with ID: ${currentNodeId}`);
        const currentNode = await this.knex('story_nodes')
            .where({ id: currentNodeId })
            .first();
        if (!currentNode) {
            this.logger.error(`Story node with ID ${currentNodeId} not found for character ${character.id}!`);
            throw new common_1.NotFoundException(`Story node ${currentNodeId} not found.`);
        }
        this.logger.debug(`Found story node: ${currentNode.id}`);
        this.logger.debug(`Workspaceing and evaluating choices for source node ID: ${currentNodeId}`);
        const potentialChoices = await this.knex('choices')
            .where({ source_node_id: currentNodeId });
        const availableChoices = [];
        for (const choice of potentialChoices) {
            const isAvailable = this.checkChoiceAvailability(choice, character);
            this.logger.debug(`Choice <span class="math-inline">\{choice\.id\} \(</span>{choice.text}) - Available: ${isAvailable}`);
            availableChoices.push({
                id: choice.id,
                text: choice.text,
                isAvailable: isAvailable
            });
        }
        this.logger.debug(`Evaluated ${availableChoices.length} choices.`);
        let enemyData = null;
        if (currentNode.enemy_id) {
            const enemy = await this.knex('enemies').where({ id: currentNode.enemy_id }).first();
            if (enemy) {
                enemyData = {
                    name: enemy.name,
                    health: enemy.health,
                    skill: enemy.skill
                };
            }
            else {
                this.logger.error(`Enemy with ID ${currentNode.enemy_id} not found!`);
            }
        }
        const gameState = {
            node: {
                id: currentNode.id,
                text: currentNode.text,
                image: currentNode.image,
            },
            choices: availableChoices,
            character: {
                health: character.health,
                skill: character.skill,
                luck: character.luck,
                stamina: character.stamina,
                name: character.name
            },
            combat: enemyData
        };
        return gameState;
    }
    checkChoiceAvailability(choice, character) {
        const reqStatCheck = choice.required_stat_check;
        if (typeof reqStatCheck === 'string') {
            const parts = reqStatCheck.match(/(\w+)\s*(>=|<=|>|<|==|!=)\s*(\d+)/);
            if (parts) {
            }
            else {
                this.logger.warn(`Could not parse stat requirement: ${reqStatCheck}`);
                return false;
            }
            return true;
        }
        if (choice.required_stat_check) {
            const parts = choice.required_stat_check.match(/(\w+)\s*(>=|<=|>|<|==|!=)\s*(\d+)/);
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
                if (characterValue === null || characterValue === undefined)
                    return false;
                this.logger.debug(`Checking stat requirement: <span class="math-inline">\{stat\} \(</span>{characterValue}) ${operator} ${requiredValue}`);
                switch (operator) {
                    case '>=':
                        if (!(characterValue >= requiredValue))
                            return false;
                        break;
                    case '<=':
                        if (!(characterValue <= requiredValue))
                            return false;
                        break;
                    case '>':
                        if (!(characterValue > requiredValue))
                            return false;
                        break;
                    case '<':
                        if (!(characterValue < requiredValue))
                            return false;
                        break;
                    case '==':
                        if (!(characterValue == requiredValue))
                            return false;
                        break;
                    case '!=':
                        if (!(characterValue != requiredValue))
                            return false;
                        break;
                    default: return false;
                }
            }
            else {
                this.logger.warn(`Could not parse stat requirement: ${choice.required_stat_check}`);
                return false;
            }
        }
        return true;
    }
    async makeChoice(userId, choiceId) {
        this.logger.log(`Processing choice ID: ${choiceId} for user ID: ${userId}`);
        const character = await this.characterService.findByUserId(userId);
        if (!character) {
            throw new common_1.NotFoundException('Character not found.');
        }
        const currentNodeId = character.current_node_id;
        if (!currentNodeId) {
            throw new common_1.BadRequestException('Cannot make a choice without being at a node.');
        }
        const choice = await this.knex('choices')
            .where({ id: choiceId, source_node_id: currentNodeId })
            .first();
        if (!choice) {
            throw new common_1.BadRequestException(`Invalid choice ID: ${choiceId}`);
        }
        if (!this.checkChoiceAvailability(choice, character)) {
            this.logger.warn(`Choice requirement not met for choice ${choiceId} by user ${userId}.`);
            throw new common_1.ForbiddenException('You do not meet the requirements for this choice.');
        }
        const targetNodeId = choice.target_node_id;
        this.logger.debug(`Choice ${choiceId} is valid and requirements met. Target node ID: ${targetNodeId}`);
        let newHealth = character.health;
        let newSkill = character.skill;
        let newLuck = character.luck ?? undefined;
        let newStamina = character.stamina ?? undefined;
        let itemsToAdd = [];
        const targetNode = await this.knex('story_nodes')
            .where({ id: targetNodeId })
            .first();
        if (!targetNode) {
            this.logger.error(`Target node ${targetNodeId} not found!`);
            throw new common_1.InternalServerErrorException('Target node missing.');
        }
        if (targetNode.health_effect !== null && targetNode.health_effect !== undefined) {
            this.logger.log(`Applying health effect ${targetNode.health_effect} from node ${targetNodeId}`);
            newHealth = Math.max(0, newHealth + targetNode.health_effect);
            this.logger.log(`Character new health calculated: ${newHealth}`);
        }
        if (targetNode.item_reward_id !== null && targetNode.item_reward_id !== undefined) {
            this.logger.log(`Applying item reward ID ${targetNode.item_reward_id} from node ${targetNodeId}`);
            this.logger.warn(`Inventory system not implemented. Would add item: ${targetNode.item_reward_id}`);
        }
        const updates = {
            current_node_id: targetNodeId,
            health: newHealth,
        };
        this.logger.debug(`Updating character ${character.id} with data: ${JSON.stringify(updates)}`);
        await this.characterService.updateCharacter(character.id, updates);
        this.logger.log(`Choice processed successfully for user ${userId}. Fetching new game state.`);
        return this.getCurrentGameState(userId);
    }
};
exports.GameService = GameService;
exports.GameService = GameService = GameService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(database_module_1.KNEX_CONNECTION)),
    __metadata("design:paramtypes", [Function, character_service_1.CharacterService])
], GameService);
//# sourceMappingURL=game.service.js.map