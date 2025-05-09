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
var AdminItemsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminItemsService = void 0;
const common_1 = require("@nestjs/common");
const knex_1 = require("knex");
const database_module_1 = require("../../database/database.module");
let AdminItemsService = AdminItemsService_1 = class AdminItemsService {
    knex;
    logger = new common_1.Logger(AdminItemsService_1.name);
    constructor(knex) {
        this.knex = knex;
    }
    async findAll() {
        this.logger.log('Fetching all items for admin');
        return this.knex('items').select('*').orderBy('id');
    }
    async findOne(id) {
        this.logger.log(`Workspaceing item with ID: ${id}`);
        const item = await this.knex('items').where({ id }).first();
        if (!item) {
            this.logger.warn(`Item with ID ${id} not found.`);
            throw new common_1.NotFoundException(`Item with ID ${id} not found.`);
        }
        return item;
    }
    async create(createItemDto) {
        this.logger.log(`Attempting to create new item with name: ${createItemDto.name}`);
        try {
            const [newItem] = await this.knex('items')
                .insert(createItemDto)
                .returning('*');
            this.logger.log(`Item created with ID: ${newItem.id}`);
            return newItem;
        }
        catch (error) {
            this.logger.error(`Failed to create item: ${error}`, error.stack);
            if (error.code === '23505') {
                throw new common_1.ConflictException(`Item with name '${createItemDto.name}' already exists.`);
            }
            throw new common_1.InternalServerErrorException('Failed to create item.');
        }
    }
    async update(id, updateItemDto) {
        this.logger.log(`Attempting to update item with ID: ${id}`);
        if (Object.keys(updateItemDto).length === 0) {
            this.logger.warn(`Update called for item ${id} with empty data.`);
            return this.findOne(id);
        }
        try {
            const [updatedItem] = await this.knex('items')
                .where({ id })
                .update(updateItemDto)
                .returning('*');
            if (!updatedItem) {
                this.logger.warn(`Item with ID ${id} not found for update.`);
                throw new common_1.NotFoundException(`Item with ID ${id} not found.`);
            }
            this.logger.log(`Item ${id} updated successfully.`);
            return updatedItem;
        }
        catch (error) {
            this.logger.error(`Failed to update item ${id}: ${error}`, error.stack);
            if (error.code === '23505') {
                throw new common_1.ConflictException(`An item with the new name might already exist.`);
            }
            throw new common_1.InternalServerErrorException('Failed to update item.');
        }
    }
    async remove(id) {
        this.logger.log(`Attempting to remove item with ID: ${id}`);
        try {
            const numDeleted = await this.knex('items').where({ id }).del();
            if (numDeleted === 0) {
                this.logger.warn(`Item with ID ${id} not found for removal.`);
                throw new common_1.NotFoundException(`Item with ID ${id} not found.`);
            }
            this.logger.log(`Item ${id} removed successfully.`);
        }
        catch (error) {
            this.logger.error(`Failed to remove item ${id}: ${error}`, error.stack);
            if (error.code === '23503') {
                throw new common_1.ConflictException(`Cannot delete item ${id} because other records (e.g., choices, enemies, inventory) depend on it.`);
            }
            throw new common_1.InternalServerErrorException('Failed to remove item.');
        }
    }
};
exports.AdminItemsService = AdminItemsService;
exports.AdminItemsService = AdminItemsService = AdminItemsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(database_module_1.KNEX_CONNECTION)),
    __metadata("design:paramtypes", [Function])
], AdminItemsService);
//# sourceMappingURL=items.service.js.map