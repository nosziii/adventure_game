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
var AdminNodesController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminNodesController = void 0;
const common_1 = require("@nestjs/common");
const nodes_service_1 = require("./nodes.service");
const dto_1 = require("./dto");
const passport_1 = require("@nestjs/passport");
const roles_guard_1 = require("../../auth/guards/roles.guard");
const roles_decorator_1 = require("../../auth/decorators/roles.decorator");
const mapStoryNodeToNodeDto = (node) => {
    return {
        id: node.id,
        text: node.text,
        image: node.image,
        is_end: node.is_end,
        health_effect: node.health_effect,
        item_reward_id: node.item_reward_id,
        enemy_id: node.enemy_id,
        created_at: node.created_at,
        updated_at: node.updated_at
    };
};
let AdminNodesController = AdminNodesController_1 = class AdminNodesController {
    adminNodesService;
    logger = new common_1.Logger(AdminNodesController_1.name);
    constructor(adminNodesService) {
        this.adminNodesService = adminNodesService;
    }
    async findAll() {
        this.logger.log('Request received for finding all nodes');
        const nodes = await this.adminNodesService.findAll();
        return nodes.map(mapStoryNodeToNodeDto);
    }
    async findOne(id) {
        this.logger.log(`Request received for finding node with ID: ${id}`);
        const node = await this.adminNodesService.findOne(id);
        return mapStoryNodeToNodeDto(node);
    }
    async create(createNodeDto) {
        this.logger.log('Request received to create a new node');
        try {
            const newNode = await this.adminNodesService.create(createNodeDto);
            return mapStoryNodeToNodeDto(newNode);
        }
        catch (error) {
            this.logger.error(`Error during node creation: ${error}`);
            throw error;
        }
    }
    async update(id, updateNodeDto) {
        this.logger.log(`Request received to update node with ID: ${id}`);
        try {
            const updatedNode = await this.adminNodesService.update(id, updateNodeDto);
            return mapStoryNodeToNodeDto(updatedNode);
        }
        catch (error) {
            this.logger.error(`Error during node update for ID ${id}: ${error}`);
            if (error instanceof common_1.NotFoundException) {
                throw new common_1.NotFoundException(error.message);
            }
            throw error;
        }
    }
    async remove(id) {
        this.logger.log(`Request received to remove node with ID: ${id}`);
        try {
            await this.adminNodesService.remove(id);
        }
        catch (error) {
            this.logger.error(`Error during node removal for ID ${id}: ${error}`);
            if (error instanceof common_1.NotFoundException || error instanceof common_1.ConflictException) {
                throw error;
            }
            throw error;
        }
    }
};
exports.AdminNodesController = AdminNodesController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)('admin'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminNodesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AdminNodesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateNodeDto]),
    __metadata("design:returntype", Promise)
], AdminNodesController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, dto_1.UpdateNodeDto]),
    __metadata("design:returntype", Promise)
], AdminNodesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AdminNodesController.prototype, "remove", null);
exports.AdminNodesController = AdminNodesController = AdminNodesController_1 = __decorate([
    (0, common_1.Controller)('admin/nodes'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [nodes_service_1.AdminNodesService])
], AdminNodesController);
//# sourceMappingURL=nodes.controller.js.map