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
var AdminChoicesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminChoicesService = void 0;
const common_1 = require("@nestjs/common");
const knex_1 = require("knex");
const database_module_1 = require("../../database/database.module");
let AdminChoicesService = AdminChoicesService_1 = class AdminChoicesService {
    knex;
    logger = new common_1.Logger(AdminChoicesService_1.name);
    constructor(knex) {
        this.knex = knex;
    }
    dtoToDbChoice(dto) {
        const dbData = {};
        if (dto.sourceNodeId !== undefined)
            dbData.source_node_id = dto.sourceNodeId;
        if (dto.targetNodeId !== undefined)
            dbData.target_node_id = dto.targetNodeId;
        if (dto.text !== undefined)
            dbData.text = dto.text;
        if (dto.requiredItemId !== undefined)
            dbData.required_item_id = dto.requiredItemId;
        if (dto.itemCostId !== undefined)
            dbData.item_cost_id = dto.itemCostId;
        if (dto.requiredStatCheck !== undefined)
            dbData.required_stat_check = dto.requiredStatCheck;
        return dbData;
    }
    async findAll(sourceNodeId) {
        this.logger.log(`Workspaceing all choices for admin ${sourceNodeId ? `for sourceNodeId: ${sourceNodeId}` : ''}`);
        let query = this.knex('choices').select('*');
        if (sourceNodeId) {
            query = query.where({ source_node_id: sourceNodeId });
        }
        return query.orderBy('id');
    }
    async findOne(id) {
        this.logger.log(`Workspaceing choice with ID: ${id}`);
        const choice = await this.knex('choices').where({ id }).first();
        if (!choice) {
            this.logger.warn(`Choice with ID ${id} not found.`);
            throw new common_1.NotFoundException(`Choice with ID ${id} not found.`);
        }
        return choice;
    }
    async create(createChoiceDto) {
        this.logger.log(`Attempting to create new choice`);
        const dbChoiceData = this.dtoToDbChoice(createChoiceDto);
        try {
            const [newChoice] = await this.knex('choices')
                .insert(dbChoiceData)
                .returning('*');
            this.logger.log(`Choice created with ID: ${newChoice.id}`);
            return newChoice;
        }
        catch (error) {
            this.logger.error(`Failed to create choice: ${error}`, error.stack);
            if (error.code === '23503') {
                throw new common_1.BadRequestException('Invalid source_node_id or target_node_id (node does not exist).');
            }
            throw new common_1.InternalServerErrorException('Failed to create choice.');
        }
    }
    async update(id, updateChoiceDto) {
        this.logger.log(`Attempting to update choice with ID: ${id}`);
        const dbChoiceUpdates = this.dtoToDbChoice(updateChoiceDto);
        if (Object.keys(dbChoiceUpdates).length === 0) {
            this.logger.warn(`Update called for choice ${id} with empty data.`);
            return this.findOne(id);
        }
        try {
            const [updatedChoice] = await this.knex('choices')
                .where({ id })
                .update(dbChoiceUpdates)
                .returning('*');
            if (!updatedChoice) {
                this.logger.warn(`Choice with ID ${id} not found for update.`);
                throw new common_1.NotFoundException(`Choice with ID ${id} not found.`);
            }
            this.logger.log(`Choice ${id} updated successfully.`);
            return updatedChoice;
        }
        catch (error) {
            this.logger.error(`Failed to update choice ${id}: ${error}`, error.stack);
            if (error.code === '23503') {
                throw new common_1.BadRequestException('Invalid source_node_id or target_node_id for update.');
            }
            throw new common_1.InternalServerErrorException('Failed to update choice.');
        }
    }
    async remove(id) {
        this.logger.log(`Attempting to remove choice with ID: ${id}`);
        try {
            const numDeleted = await this.knex('choices')
                .where({ id })
                .del();
            if (numDeleted === 0) {
                this.logger.warn(`Choice with ID ${id} not found for removal.`);
                throw new common_1.NotFoundException(`Choice with ID ${id} not found.`);
            }
            this.logger.log(`Choice ${id} removed successfully.`);
        }
        catch (error) {
            this.logger.error(`Failed to remove choice ${id}: ${error}`, error.stack);
            throw new common_1.InternalServerErrorException('Failed to remove choice.');
        }
    }
};
exports.AdminChoicesService = AdminChoicesService;
exports.AdminChoicesService = AdminChoicesService = AdminChoicesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(database_module_1.KNEX_CONNECTION)),
    __metadata("design:paramtypes", [Function])
], AdminChoicesService);
//# sourceMappingURL=choices.service.js.map