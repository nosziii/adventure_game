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
var AdminEnemiesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminEnemiesService = void 0;
const common_1 = require("@nestjs/common");
const knex_1 = require("knex");
const database_module_1 = require("../../database/database.module");
let AdminEnemiesService = AdminEnemiesService_1 = class AdminEnemiesService {
    knex;
    logger = new common_1.Logger(AdminEnemiesService_1.name);
    constructor(knex) {
        this.knex = knex;
    }
    dtoToDbEnemy(dto) {
        const dbData = {};
        if (dto.name !== undefined)
            dbData.name = dto.name;
        if (dto.health !== undefined)
            dbData.health = dto.health;
        if (dto.skill !== undefined)
            dbData.skill = dto.skill;
        if (dto.attackDescription !== undefined)
            dbData.attack_description = dto.attackDescription;
        if (dto.defeatText !== undefined)
            dbData.defeat_text = dto.defeatText;
        if (dto.itemDropId !== undefined)
            dbData.item_drop_id = dto.itemDropId;
        if (dto.xpReward !== undefined)
            dbData.xp_reward = dto.xpReward;
        return dbData;
    }
    async findAll() {
        this.logger.log('Fetching all enemies for admin');
        return this.knex('enemies').select('*').orderBy('id');
    }
    async findOne(id) {
        this.logger.log(`Workspaceing enemy with ID: ${id}`);
        const enemy = await this.knex('enemies').where({ id }).first();
        if (!enemy) {
            this.logger.warn(`Enemy with ID ${id} not found.`);
            throw new common_1.NotFoundException(`Enemy with ID ${id} not found.`);
        }
        return enemy;
    }
    async create(createEnemyDto) {
        this.logger.log(`Attempting to create new enemy with name: ${createEnemyDto.name}`);
        const dbEnemyData = this.dtoToDbEnemy(createEnemyDto);
        try {
            const [newEnemy] = await this.knex('enemies')
                .insert(dbEnemyData)
                .returning('*');
            this.logger.log(`Enemy created with ID: ${newEnemy.id}`);
            return newEnemy;
        }
        catch (error) {
            this.logger.error(`Failed to create enemy: ${error}`, error.stack);
            if (error.code === '23505') {
                throw new common_1.ConflictException(`Enemy with name '${createEnemyDto.name}' might already exist or other unique constraint violation.`);
            }
            if (error.code === '23503') {
                throw new common_1.BadRequestException('Invalid item_drop_id (item does not exist).');
            }
            throw new common_1.InternalServerErrorException('Failed to create enemy.');
        }
    }
    async update(id, updateEnemyDto) {
        this.logger.log(`Attempting to update enemy with ID: ${id}`);
        const dbEnemyUpdates = this.dtoToDbEnemy(updateEnemyDto);
        if (Object.keys(dbEnemyUpdates).length === 0) {
            this.logger.warn(`Update called for enemy ${id} with empty data.`);
            return this.findOne(id);
        }
        try {
            const [updatedEnemy] = await this.knex('enemies')
                .where({ id })
                .update(dbEnemyUpdates)
                .returning('*');
            if (!updatedEnemy) {
                this.logger.warn(`Enemy with ID ${id} not found for update.`);
                throw new common_1.NotFoundException(`Enemy with ID ${id} not found.`);
            }
            this.logger.log(`Enemy ${id} updated successfully.`);
            return updatedEnemy;
        }
        catch (error) {
            this.logger.error(`Failed to update enemy ${id}: ${error}`, error.stack);
            if (error.code === '23503') {
                throw new common_1.BadRequestException('Invalid item_drop_id for update.');
            }
            throw new common_1.InternalServerErrorException('Failed to update enemy.');
        }
    }
    async remove(id) {
        this.logger.log(`Attempting to remove enemy with ID: ${id}`);
        try {
            const numDeleted = await this.knex('enemies').where({ id }).del();
            if (numDeleted === 0) {
                this.logger.warn(`Enemy with ID ${id} not found for removal.`);
                throw new common_1.NotFoundException(`Enemy with ID ${id} not found.`);
            }
            this.logger.log(`Enemy ${id} removed successfully.`);
        }
        catch (error) {
            this.logger.error(`Failed to remove enemy ${id}: ${error}`, error.stack);
            if (error.code === '23503') {
                throw new common_1.ConflictException(`Cannot delete enemy ${id} because other records (e.g., story nodes) depend on it.`);
            }
            throw new common_1.InternalServerErrorException('Failed to remove enemy.');
        }
    }
};
exports.AdminEnemiesService = AdminEnemiesService;
exports.AdminEnemiesService = AdminEnemiesService = AdminEnemiesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(database_module_1.KNEX_CONNECTION)),
    __metadata("design:paramtypes", [Function])
], AdminEnemiesService);
//# sourceMappingURL=enemies.service.js.map