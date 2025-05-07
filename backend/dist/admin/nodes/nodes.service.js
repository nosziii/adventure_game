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
var AdminNodesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminNodesService = void 0;
const common_1 = require("@nestjs/common");
const knex_1 = require("knex");
const database_module_1 = require("../../database/database.module");
let AdminNodesService = AdminNodesService_1 = class AdminNodesService {
    knex;
    logger = new common_1.Logger(AdminNodesService_1.name);
    constructor(knex) {
        this.knex = knex;
    }
    dtoToDbNode(dto) {
        const dbData = {};
        if (dto.text !== undefined)
            dbData.text = dto.text;
        if (dto.image !== undefined)
            dbData.image = dto.image;
        if (dto.is_end !== undefined)
            dbData.is_end = dto.is_end;
        if (dto.health_effect !== undefined)
            dbData.health_effect = dto.health_effect;
        if (dto.item_reward_id !== undefined)
            dbData.item_reward_id = dto.item_reward_id;
        if (dto.enemy_id !== undefined)
            dbData.enemy_id = dto.enemy_id;
        return dbData;
    }
    async findAll() {
        this.logger.log('Fetching all story nodes for admin');
        return this.knex('story_nodes').select('*').orderBy('id');
    }
    async findOne(id) {
        this.logger.log(`Workspaceing story node with ID: ${id}`);
        const node = await this.knex('story_nodes').where({ id }).first();
        if (!node) {
            this.logger.warn(`Story node with ID ${id} not found.`);
            throw new common_1.NotFoundException(`Story node with ID ${id} not found.`);
        }
        return node;
    }
    async create(createNodeDto) {
        this.logger.log(`Attempting to create new story node`);
        try {
            const dbNodeData = this.dtoToDbNode(createNodeDto);
            const [newNode] = await this.knex('story_nodes')
                .insert(dbNodeData)
                .returning('*');
            this.logger.log(`Story node created with ID: ${newNode.id}`);
            return newNode;
        }
        catch (error) {
            this.logger.error(`Failed to create story node: ${error}`, error.stack);
            throw new common_1.InternalServerErrorException('Failed to create story node.');
        }
    }
    async update(id, updateNodeDto) {
        this.logger.log(`Attempting to update story node with ID: ${id}`);
        try {
            const dbNodeUpdates = this.dtoToDbNode(updateNodeDto);
            if (Object.keys(dbNodeUpdates).length === 0) {
                this.logger.warn(`Update called for node ${id} with empty data.`);
                return this.findOne(id);
            }
            const [updatedNode] = await this.knex('story_nodes')
                .where({ id })
                .update(dbNodeUpdates)
                .returning('*');
            if (!updatedNode) {
                this.logger.warn(`Story node with ID ${id} not found for update.`);
                throw new common_1.NotFoundException(`Story node with ID ${id} not found.`);
            }
            this.logger.log(`Story node ${id} updated successfully.`);
            return updatedNode;
        }
        catch (error) {
            this.logger.error(`Failed to update story node ${id}: ${error}`, error.stack);
            throw new common_1.InternalServerErrorException('Failed to update story node.');
        }
    }
    async remove(id) {
        this.logger.log(`Attempting to remove story node with ID: ${id}`);
        try {
            const numDeleted = await this.knex('story_nodes')
                .where({ id })
                .del();
            if (numDeleted === 0) {
                this.logger.warn(`Story node with ID ${id} not found for removal.`);
                throw new common_1.NotFoundException(`Story node with ID ${id} not found.`);
            }
            this.logger.log(`Story node ${id} removed successfully.`);
        }
        catch (error) {
            this.logger.error(`Failed to remove story node ${id}: ${error}`, error.stack);
            if (error.code === '23503') {
                throw new common_1.ConflictException(`Cannot delete node ${id} because other records (e.g., choices) depend on it.`);
            }
            throw new common_1.InternalServerErrorException('Failed to remove story node.');
        }
    }
};
exports.AdminNodesService = AdminNodesService;
exports.AdminNodesService = AdminNodesService = AdminNodesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(database_module_1.KNEX_CONNECTION)),
    __metadata("design:paramtypes", [Function])
], AdminNodesService);
//# sourceMappingURL=nodes.service.js.map