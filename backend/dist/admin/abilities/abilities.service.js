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
var AdminAbilitiesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminAbilitiesService = void 0;
const common_1 = require("@nestjs/common");
const knex_1 = require("knex");
const database_module_1 = require("../../database/database.module");
let AdminAbilitiesService = AdminAbilitiesService_1 = class AdminAbilitiesService {
    knex;
    logger = new common_1.Logger(AdminAbilitiesService_1.name);
    constructor(knex) {
        this.knex = knex;
    }
    dtoToDbAbility(dto) {
        const dbData = {};
        if (dto.name !== undefined)
            dbData.name = dto.name;
        if (dto.description !== undefined)
            dbData.description = dto.description;
        if (dto.type !== undefined)
            dbData.type = dto.type;
        if (dto.effectString !== undefined)
            dbData.effect_string = dto.effectString;
        if (dto.talentPointCost !== undefined)
            dbData.talent_point_cost = dto.talentPointCost;
        if (dto.levelRequirement !== undefined)
            dbData.level_requirement = dto.levelRequirement;
        if (dto.prerequisites !== undefined)
            dbData.prerequisites = dto.prerequisites;
        return dbData;
    }
    async findAll() {
        this.logger.log('Fetching all abilities for admin');
        return this.knex('abilities').select('*').orderBy('id');
    }
    async findOne(id) {
        this.logger.log(`Workspaceing ability with ID: ${id}`);
        const ability = await this.knex('abilities')
            .where({ id })
            .first();
        if (!ability) {
            this.logger.warn(`Ability with ID ${id} not found.`);
            throw new common_1.NotFoundException(`Ability with ID ${id} not found.`);
        }
        return ability;
    }
    async create(createAbilityDto) {
        this.logger.log(`Attempting to create new ability with name: ${createAbilityDto.name}`);
        const dbAbilityData = this.dtoToDbAbility(createAbilityDto);
        try {
            const [newAbility] = await this.knex('abilities')
                .insert(dbAbilityData)
                .returning('*');
            this.logger.log(`Ability created with ID: ${newAbility.id}`);
            return newAbility;
        }
        catch (error) {
            this.logger.error(`Failed to create ability: ${error}`, error.stack);
            if (error.code === '23505' && error.constraint === 'abilities_name_key') {
                throw new common_1.ConflictException(`Ability with name '${createAbilityDto.name}' already exists.`);
            }
            throw new common_1.InternalServerErrorException('Failed to create ability.');
        }
    }
    async update(id, updateAbilityDto) {
        this.logger.log(`Attempting to update ability with ID: ${id}`);
        const dbAbilityUpdates = this.dtoToDbAbility(updateAbilityDto);
        if (Object.keys(dbAbilityUpdates).length === 0) {
            this.logger.warn(`Update called for ability ${id} with empty data.`);
            return this.findOne(id);
        }
        try {
            const [updatedAbility] = await this.knex('abilities')
                .where({ id })
                .update(dbAbilityUpdates)
                .returning('*');
            if (!updatedAbility) {
                this.logger.warn(`Ability with ID ${id} not found for update.`);
                throw new common_1.NotFoundException(`Ability with ID ${id} not found.`);
            }
            this.logger.log(`Ability ${id} updated successfully.`);
            return updatedAbility;
        }
        catch (error) {
            this.logger.error(`Failed to update ability ${id}: ${error}`, error.stack);
            if (error.code === '23505' && error.constraint === 'abilities_name_key') {
                throw new common_1.ConflictException(`An ability with the new name might already exist.`);
            }
            throw new common_1.InternalServerErrorException('Failed to update ability.');
        }
    }
    async remove(id) {
        this.logger.log(`Attempting to remove ability with ID: ${id}`);
        try {
            const numDeleted = await this.knex('abilities').where({ id }).del();
            if (numDeleted === 0) {
                this.logger.warn(`Ability with ID ${id} not found for removal.`);
                throw new common_1.NotFoundException(`Ability with ID ${id} not found.`);
            }
            this.logger.log(`Ability ${id} removed successfully.`);
        }
        catch (error) {
            this.logger.error(`Failed to remove ability ${id}: ${error}`, error.stack);
            throw new common_1.InternalServerErrorException('Failed to remove ability.');
        }
    }
};
exports.AdminAbilitiesService = AdminAbilitiesService;
exports.AdminAbilitiesService = AdminAbilitiesService = AdminAbilitiesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(database_module_1.KNEX_CONNECTION)),
    __metadata("design:paramtypes", [Function])
], AdminAbilitiesService);
//# sourceMappingURL=abilities.service.js.map