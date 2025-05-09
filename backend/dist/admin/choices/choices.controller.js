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
var AdminChoicesController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminChoicesController = void 0;
const common_1 = require("@nestjs/common");
const choices_service_1 = require("./choices.service");
const passport_1 = require("@nestjs/passport");
const roles_guard_1 = require("../../auth/guards/roles.guard");
const roles_decorator_1 = require("../../auth/decorators/roles.decorator");
const dto_1 = require("./dto");
const mapChoiceRecordToDto = (choice) => {
    return {
        id: choice.id,
        sourceNodeId: choice.source_node_id,
        targetNodeId: choice.target_node_id,
        text: choice.text,
        requiredItemId: choice.required_item_id,
        itemCostId: choice.item_cost_id,
        requiredStatCheck: choice.required_stat_check,
        createdAt: choice.created_at,
        updatedAt: choice.updated_at
    };
};
let AdminChoicesController = AdminChoicesController_1 = class AdminChoicesController {
    adminChoicesService;
    logger = new common_1.Logger(AdminChoicesController_1.name);
    constructor(adminChoicesService) {
        this.adminChoicesService = adminChoicesService;
    }
    async findAll(sourceNodeId) {
        this.logger.log(`Request received for finding all choices ${sourceNodeId ? `for sourceNodeId: ${sourceNodeId}` : ''}`);
        const choices = await this.adminChoicesService.findAll(sourceNodeId);
        return choices.map(mapChoiceRecordToDto);
    }
    async findOne(id) {
        this.logger.log(`Request received for finding choice with ID: ${id}`);
        const choice = await this.adminChoicesService.findOne(id);
        return mapChoiceRecordToDto(choice);
    }
    async create(createChoiceDto) {
        this.logger.log('Request received to create a new choice');
        try {
            const newChoice = await this.adminChoicesService.create(createChoiceDto);
            return mapChoiceRecordToDto(newChoice);
        }
        catch (error) {
            if (error instanceof common_1.BadRequestException || error instanceof common_1.InternalServerErrorException) {
                throw error;
            }
            this.logger.error(`Unhandled error during choice creation: ${error}`);
            throw new common_1.InternalServerErrorException('An unexpected error occurred during choice creation.');
        }
    }
    async update(id, updateChoiceDto) {
        this.logger.log(`Request received to update choice with ID: ${id}`);
        try {
            const updatedChoice = await this.adminChoicesService.update(id, updateChoiceDto);
            return mapChoiceRecordToDto(updatedChoice);
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException || error instanceof common_1.BadRequestException || error instanceof common_1.InternalServerErrorException) {
                throw error;
            }
            this.logger.error(`Unhandled error during choice update for ID ${id}: ${error}`);
            throw new common_1.InternalServerErrorException('An unexpected error occurred during choice update.');
        }
    }
    async remove(id) {
        this.logger.log(`Request received to remove choice with ID: ${id}`);
        try {
            await this.adminChoicesService.remove(id);
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException || error instanceof common_1.InternalServerErrorException) {
                throw error;
            }
            this.logger.error(`Unhandled error during choice removal for ID ${id}: ${error}`);
            throw new common_1.InternalServerErrorException('An unexpected error occurred during choice removal.');
        }
    }
};
exports.AdminChoicesController = AdminChoicesController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Query)('sourceNodeId', new common_1.DefaultValuePipe(undefined), new common_1.ParseIntPipe({ optional: true }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AdminChoicesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AdminChoicesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateChoiceDto]),
    __metadata("design:returntype", Promise)
], AdminChoicesController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, dto_1.UpdateChoiceDto]),
    __metadata("design:returntype", Promise)
], AdminChoicesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AdminChoicesController.prototype, "remove", null);
exports.AdminChoicesController = AdminChoicesController = AdminChoicesController_1 = __decorate([
    (0, common_1.Controller)('admin/choices'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [choices_service_1.AdminChoicesService])
], AdminChoicesController);
//# sourceMappingURL=choices.controller.js.map