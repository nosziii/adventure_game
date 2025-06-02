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
var AdminAbilitiesController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminAbilitiesController = void 0;
const common_1 = require("@nestjs/common");
const abilities_service_1 = require("./abilities.service");
const dto_1 = require("./dto");
const passport_1 = require("@nestjs/passport");
const roles_guard_1 = require("../../auth/guards/roles.guard");
const roles_decorator_1 = require("../../auth/decorators/roles.decorator");
const mapAbilityRecordToDto = (ability) => {
    if (!ability)
        throw new common_1.NotFoundException('Ability record not found for mapping.');
    return {
        id: ability.id,
        name: ability.name,
        description: ability.description,
        type: ability.type,
        effectString: ability.effect_string,
        talentPointCost: ability.talent_point_cost,
        levelRequirement: ability.level_requirement,
        prerequisites: ability.prerequisites,
        allowedArchetypeIds: ability.allowed_archetype_ids,
        createdAt: ability.created_at,
        updatedAt: ability.updated_at,
    };
};
let AdminAbilitiesController = AdminAbilitiesController_1 = class AdminAbilitiesController {
    adminAbilitiesService;
    logger = new common_1.Logger(AdminAbilitiesController_1.name);
    constructor(adminAbilitiesService) {
        this.adminAbilitiesService = adminAbilitiesService;
    }
    async findAll() {
        this.logger.log('Request received for finding all abilities');
        const abilities = await this.adminAbilitiesService.findAll();
        return abilities.map(mapAbilityRecordToDto);
    }
    async findOne(id) {
        this.logger.log(`Request received for finding ability with ID: ${id}`);
        const ability = await this.adminAbilitiesService.findOne(id);
        return mapAbilityRecordToDto(ability);
    }
    async create(createAbilityDto) {
        this.logger.log('Request received to create a new ability', createAbilityDto);
        try {
            const newAbility = await this.adminAbilitiesService.create(createAbilityDto);
            return mapAbilityRecordToDto(newAbility);
        }
        catch (error) {
            this.logger.error(`Error during ability creation: ${error?.message || error}`);
            throw error;
        }
    }
    async update(id, updateAbilityDto) {
        this.logger.log(`Request received to update ability with ID: ${id}`, updateAbilityDto);
        try {
            const updatedAbility = await this.adminAbilitiesService.update(id, updateAbilityDto);
            return mapAbilityRecordToDto(updatedAbility);
        }
        catch (error) {
            this.logger.error(`Error during ability update for ID ${id}: ${error?.message || error}`);
            throw error;
        }
    }
    async remove(id) {
        this.logger.log(`Request received to remove ability with ID: ${id}`);
        try {
            await this.adminAbilitiesService.remove(id);
        }
        catch (error) {
            this.logger.error(`Error during ability removal for ID ${id}: ${error?.message || error}`);
            throw error;
        }
    }
};
exports.AdminAbilitiesController = AdminAbilitiesController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)('admin'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminAbilitiesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AdminAbilitiesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateAbilityDto]),
    __metadata("design:returntype", Promise)
], AdminAbilitiesController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, dto_1.UpdateAbilityDto]),
    __metadata("design:returntype", Promise)
], AdminAbilitiesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AdminAbilitiesController.prototype, "remove", null);
exports.AdminAbilitiesController = AdminAbilitiesController = AdminAbilitiesController_1 = __decorate([
    (0, common_1.Controller)('admin/abilities'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [abilities_service_1.AdminAbilitiesService])
], AdminAbilitiesController);
//# sourceMappingURL=abilities.controller.js.map