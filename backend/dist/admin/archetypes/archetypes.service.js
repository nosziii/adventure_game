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
var AdminArchetypesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminArchetypesService = void 0;
const common_1 = require("@nestjs/common");
const knex_1 = require("knex");
const database_module_1 = require("../../database/database.module");
let AdminArchetypesService = AdminArchetypesService_1 = class AdminArchetypesService {
    knex;
    logger = new common_1.Logger(AdminArchetypesService_1.name);
    constructor(knex) {
        this.knex = knex;
    }
    dtoToDbArchetype(dto) {
        const dbData = {};
        if (dto.name !== undefined)
            dbData.name = dto.name;
        if (dto.description !== undefined)
            dbData.description = dto.description;
        if (dto.iconPath !== undefined)
            dbData.icon_path = dto.iconPath;
        if (dto.baseHealthBonus !== undefined)
            dbData.base_health_bonus = dto.baseHealthBonus;
        if (dto.baseSkillBonus !== undefined)
            dbData.base_skill_bonus = dto.baseSkillBonus;
        if (dto.baseLuckBonus !== undefined)
            dbData.base_luck_bonus = dto.baseLuckBonus;
        if (dto.baseStaminaBonus !== undefined)
            dbData.base_stamina_bonus = dto.baseStaminaBonus;
        if (dto.baseDefenseBonus !== undefined)
            dbData.base_defense_bonus = dto.baseDefenseBonus;
        if (dto.startingAbilityIds !== undefined) {
            dbData.starting_ability_ids =
                dto.startingAbilityIds === null
                    ? null
                    : JSON.stringify(dto.startingAbilityIds);
        }
        return dbData;
    }
    async findAll() {
        this.logger.log('Fetching all character archetypes for admin');
        return this.knex('character_archetypes')
            .select('*')
            .orderBy('id');
    }
    async findOne(id) {
        this.logger.log(`Workspaceing character archetype with ID: ${id}`);
        const archetype = await this.knex('character_archetypes')
            .where({ id })
            .first();
        if (!archetype) {
            this.logger.warn(`Character archetype with ID ${id} not found.`);
            throw new common_1.NotFoundException(`Character archetype with ID ${id} not found.`);
        }
        return archetype;
    }
    async create(createArchetypeDto) {
        this.logger.log(`Attempting to create new archetype with name: ${createArchetypeDto.name}`);
        const dbArchetypeData = this.dtoToDbArchetype(createArchetypeDto);
        try {
            const [newArchetype] = await this.knex('character_archetypes')
                .insert(dbArchetypeData)
                .returning('*');
            this.logger.log(`Archetype created with ID: ${newArchetype.id}`);
            return newArchetype;
        }
        catch (error) {
            this.logger.error(`Failed to create archetype: ${error}`, error.stack);
            if (error.code === '23505' &&
                error.constraint === 'character_archetypes_name_key') {
                throw new common_1.ConflictException(`Archetype with name '${createArchetypeDto.name}' already exists.`);
            }
            throw new common_1.InternalServerErrorException('Failed to create archetype.');
        }
    }
    async update(id, updateArchetypeDto) {
        this.logger.log(`Attempting to update archetype with ID: ${id}`);
        const dbArchetypeUpdates = this.dtoToDbArchetype(updateArchetypeDto);
        if (Object.keys(dbArchetypeUpdates).length === 0) {
            this.logger.warn(`Update called for archetype ${id} with empty data.`);
            return this.findOne(id);
        }
        try {
            if (updateArchetypeDto.startingAbilityIds === null) {
                dbArchetypeUpdates.starting_ability_ids = null;
            }
            const [updatedArchetype] = await this.knex('character_archetypes')
                .where({ id })
                .update(dbArchetypeUpdates)
                .returning('*');
            if (!updatedArchetype) {
                this.logger.warn(`Archetype with ID ${id} not found for update.`);
                throw new common_1.NotFoundException(`Archetype with ID ${id} not found.`);
            }
            this.logger.log(`Archetype ${id} updated successfully.`);
            return updatedArchetype;
        }
        catch (error) {
            this.logger.error(`Failed to update archetype ${id}: ${error}`, error.stack);
            if (error.code === '23505' &&
                error.constraint === 'character_archetypes_name_key') {
                throw new common_1.ConflictException(`An archetype with the new name might already exist.`);
            }
            throw new common_1.InternalServerErrorException('Failed to update archetype.');
        }
    }
    async remove(id) {
        this.logger.log(`Attempting to remove archetype with ID: ${id}`);
        try {
            const numDeleted = await this.knex('character_archetypes')
                .where({ id })
                .del();
            if (numDeleted === 0) {
                this.logger.warn(`Archetype with ID ${id} not found for removal.`);
                throw new common_1.NotFoundException(`Archetype with ID ${id} not found.`);
            }
            this.logger.log(`Archetype ${id} removed successfully.`);
        }
        catch (error) {
            this.logger.error(`Failed to remove archetype ${id}: ${error}`, error.stack);
            throw new common_1.InternalServerErrorException('Failed to remove archetype.');
        }
    }
};
exports.AdminArchetypesService = AdminArchetypesService;
exports.AdminArchetypesService = AdminArchetypesService = AdminArchetypesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(database_module_1.KNEX_CONNECTION)),
    __metadata("design:paramtypes", [Function])
], AdminArchetypesService);
//# sourceMappingURL=archetypes.service.js.map