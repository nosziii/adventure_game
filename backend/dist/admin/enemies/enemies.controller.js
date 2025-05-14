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
var AdminEnemiesController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminEnemiesController = void 0;
const common_1 = require("@nestjs/common");
const enemies_service_1 = require("./enemies.service");
const dto_1 = require("./dto");
const passport_1 = require("@nestjs/passport");
const roles_guard_1 = require("../../auth/guards/roles.guard");
const roles_decorator_1 = require("../../auth/decorators/roles.decorator");
const mapEnemyRecordToDto = (enemy) => {
    return {
        id: enemy.id,
        name: enemy.name,
        health: enemy.health,
        skill: enemy.skill,
        attackDescription: enemy.attack_description,
        defeatText: enemy.defeat_text,
        itemDropId: enemy.item_drop_id,
        xpReward: enemy.xp_reward,
        specialAttackName: enemy.special_attack_name,
        specialAttackDamageMultiplier: enemy.special_attack_damage_multiplier,
        specialAttackChargeTurns: enemy.special_attack_charge_turns,
        specialAttackTelegraphText: enemy.special_attack_telegraph_text,
        specialAttackExecuteText: enemy.special_attack_execute_text,
        createdAt: enemy.created_at,
        updatedAt: enemy.updated_at,
    };
};
let AdminEnemiesController = AdminEnemiesController_1 = class AdminEnemiesController {
    adminEnemiesService;
    logger = new common_1.Logger(AdminEnemiesController_1.name);
    constructor(adminEnemiesService) {
        this.adminEnemiesService = adminEnemiesService;
    }
    async findAll() {
        this.logger.log('Request received for finding all enemies');
        const enemies = await this.adminEnemiesService.findAll();
        return enemies.map(mapEnemyRecordToDto);
    }
    async findOne(id) {
        this.logger.log(`Request received for finding enemy with ID: ${id}`);
        const enemy = await this.adminEnemiesService.findOne(id);
        return mapEnemyRecordToDto(enemy);
    }
    async create(createEnemyDto) {
        this.logger.log('Request received to create a new enemy', createEnemyDto);
        try {
            const newEnemy = await this.adminEnemiesService.create(createEnemyDto);
            return mapEnemyRecordToDto(newEnemy);
        }
        catch (error) {
            this.logger.error(`Error during enemy creation: ${error?.message || error}`);
            throw error;
        }
    }
    async update(id, updateEnemyDto) {
        this.logger.log(`Request received to update enemy with ID: ${id}`, updateEnemyDto);
        try {
            const updatedEnemy = await this.adminEnemiesService.update(id, updateEnemyDto);
            return mapEnemyRecordToDto(updatedEnemy);
        }
        catch (error) {
            this.logger.error(`Error during enemy update for ID ${id}: ${error?.message || error}`);
            throw error;
        }
    }
    async remove(id) {
        this.logger.log(`Request received to remove enemy with ID: ${id}`);
        try {
            await this.adminEnemiesService.remove(id);
        }
        catch (error) {
            this.logger.error(`Error during enemy removal for ID ${id}: ${error?.message || error}`);
            throw error;
        }
    }
};
exports.AdminEnemiesController = AdminEnemiesController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)('admin'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminEnemiesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AdminEnemiesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateEnemyDto]),
    __metadata("design:returntype", Promise)
], AdminEnemiesController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, dto_1.UpdateEnemyDto]),
    __metadata("design:returntype", Promise)
], AdminEnemiesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AdminEnemiesController.prototype, "remove", null);
exports.AdminEnemiesController = AdminEnemiesController = AdminEnemiesController_1 = __decorate([
    (0, common_1.Controller)('admin/enemies'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [enemies_service_1.AdminEnemiesService])
], AdminEnemiesController);
//# sourceMappingURL=enemies.controller.js.map