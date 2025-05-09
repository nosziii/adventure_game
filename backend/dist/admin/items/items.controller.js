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
var AdminItemsController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminItemsController = void 0;
const common_1 = require("@nestjs/common");
const items_service_1 = require("./items.service");
const passport_1 = require("@nestjs/passport");
const roles_guard_1 = require("../../auth/guards/roles.guard");
const roles_decorator_1 = require("../../auth/decorators/roles.decorator");
const dto_1 = require("./dto");
const mapItemRecordToDto = (item) => {
    return {
        id: item.id,
        name: item.name,
        description: item.description,
        type: item.type,
        effect: item.effect,
        usable: item.usable,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
    };
};
let AdminItemsController = AdminItemsController_1 = class AdminItemsController {
    adminItemsService;
    logger = new common_1.Logger(AdminItemsController_1.name);
    constructor(adminItemsService) {
        this.adminItemsService = adminItemsService;
    }
    async findAll() {
        this.logger.log('Request received for finding all items');
        const items = await this.adminItemsService.findAll();
        return items.map(mapItemRecordToDto);
    }
    async findOne(id) {
        this.logger.log(`Request received for finding item with ID: ${id}`);
        const item = await this.adminItemsService.findOne(id);
        return mapItemRecordToDto(item);
    }
    async create(createItemDto) {
        this.logger.log('Request received to create a new item with data:', createItemDto);
        try {
            const newItem = await this.adminItemsService.create(createItemDto);
            return mapItemRecordToDto(newItem);
        }
        catch (error) {
            this.logger.error(`Error during item creation: ${error?.message || error}`);
            throw error;
        }
    }
    async update(id, updateItemDto) {
        this.logger.log(`Request received to update item with ID: ${id} with data:`, updateItemDto);
        try {
            const updatedItem = await this.adminItemsService.update(id, updateItemDto);
            return mapItemRecordToDto(updatedItem);
        }
        catch (error) {
            this.logger.error(`Error during item update for ID ${id}: ${error?.message || error}`);
            throw error;
        }
    }
    async remove(id) {
        this.logger.log(`Request received to remove item with ID: ${id}`);
        try {
            await this.adminItemsService.remove(id);
        }
        catch (error) {
            this.logger.error(`Error during item removal for ID ${id}: ${error?.message || error}`);
            throw error;
        }
    }
};
exports.AdminItemsController = AdminItemsController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)('admin'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminItemsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AdminItemsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateItemDto]),
    __metadata("design:returntype", Promise)
], AdminItemsController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, dto_1.UpdateItemDto]),
    __metadata("design:returntype", Promise)
], AdminItemsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AdminItemsController.prototype, "remove", null);
exports.AdminItemsController = AdminItemsController = AdminItemsController_1 = __decorate([
    (0, common_1.Controller)('admin/items'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [items_service_1.AdminItemsService])
], AdminItemsController);
//# sourceMappingURL=items.controller.js.map