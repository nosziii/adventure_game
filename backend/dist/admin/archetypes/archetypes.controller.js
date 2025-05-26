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
var AdminArchetypesController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminArchetypesController = void 0;
const common_1 = require("@nestjs/common");
const archetypes_service_1 = require("./archetypes.service");
const dto_1 = require("./dto");
const passport_1 = require("@nestjs/passport");
const roles_guard_1 = require("../../auth/guards/roles.guard");
const roles_decorator_1 = require("../../auth/decorators/roles.decorator");
const mapArchetypeRecordToDto = (archetype) => {
    if (!archetype)
        throw new common_1.NotFoundException('Archetype record not found for mapping.');
    return {
        id: archetype.id,
        name: archetype.name,
        description: archetype.description,
        iconPath: archetype.icon_path,
        baseHealthBonus: archetype.base_health_bonus,
        baseSkillBonus: archetype.base_skill_bonus,
        baseLuckBonus: archetype.base_luck_bonus,
        baseStaminaBonus: archetype.base_stamina_bonus,
        baseDefenseBonus: archetype.base_defense_bonus,
        startingAbilityIds: archetype.starting_ability_ids,
        createdAt: archetype.created_at,
        updatedAt: archetype.updated_at,
    };
};
let AdminArchetypesController = AdminArchetypesController_1 = class AdminArchetypesController {
    adminArchetypesService;
    logger = new common_1.Logger(AdminArchetypesController_1.name);
    constructor(adminArchetypesService) {
        this.adminArchetypesService = adminArchetypesService;
    }
    async findAll() {
        this.logger.log('Request received for finding all archetypes');
        const archetypes = await this.adminArchetypesService.findAll();
        return archetypes.map(mapArchetypeRecordToDto);
    }
    async findOne(id) {
        this.logger.log(`Request received for finding archetype with ID: ${id}`);
        const archetype = await this.adminArchetypesService.findOne(id);
        return mapArchetypeRecordToDto(archetype);
    }
    async create(createArchetypeDto) {
        this.logger.log('Request received to create a new archetype', createArchetypeDto);
        try {
            const newArchetype = await this.adminArchetypesService.create(createArchetypeDto);
            return mapArchetypeRecordToDto(newArchetype);
        }
        catch (error) {
            this.logger.error(`Error during archetype creation: ${error?.message || error}`);
            throw error;
        }
    }
    async update(id, updateArchetypeDto) {
        this.logger.log(`Request received to update archetype with ID: ${id}`, updateArchetypeDto);
        try {
            const updatedArchetype = await this.adminArchetypesService.update(id, updateArchetypeDto);
            return mapArchetypeRecordToDto(updatedArchetype);
        }
        catch (error) {
            this.logger.error(`Error during archetype update for ID ${id}: ${error?.message || error}`);
            throw error;
        }
    }
    async remove(id) {
        this.logger.log(`Request received to remove archetype with ID: ${id}`);
        try {
            await this.adminArchetypesService.remove(id);
        }
        catch (error) {
            this.logger.error(`Error during archetype removal for ID ${id}: ${error?.message || error}`);
            throw error;
        }
    }
};
exports.AdminArchetypesController = AdminArchetypesController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)('admin'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminArchetypesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AdminArchetypesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateArchetypeDto]),
    __metadata("design:returntype", Promise)
], AdminArchetypesController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, dto_1.UpdateArchetypeDto]),
    __metadata("design:returntype", Promise)
], AdminArchetypesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AdminArchetypesController.prototype, "remove", null);
exports.AdminArchetypesController = AdminArchetypesController = AdminArchetypesController_1 = __decorate([
    (0, common_1.Controller)('admin/archetypes'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [archetypes_service_1.AdminArchetypesService])
], AdminArchetypesController);
//# sourceMappingURL=archetypes.controller.js.map