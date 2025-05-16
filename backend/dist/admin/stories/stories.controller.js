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
var AdminStoriesController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminStoriesController = void 0;
const common_1 = require("@nestjs/common");
const stories_service_1 = require("./stories.service");
const dto_1 = require("./dto");
const passport_1 = require("@nestjs/passport");
const roles_guard_1 = require("../../auth/guards/roles.guard");
const roles_decorator_1 = require("../../auth/decorators/roles.decorator");
const mapStoryRecordToDto = (story) => {
    if (!story)
        throw new common_1.NotFoundException('Story record not found for mapping.');
    return {
        id: story.id,
        title: story.title,
        description: story.description,
        startingNodeId: story.starting_node_id,
        isPublished: story.is_published,
        createdAt: story.created_at,
        updatedAt: story.updated_at,
    };
};
let AdminStoriesController = AdminStoriesController_1 = class AdminStoriesController {
    adminStoriesService;
    logger = new common_1.Logger(AdminStoriesController_1.name);
    constructor(adminStoriesService) {
        this.adminStoriesService = adminStoriesService;
    }
    async findAll() {
        this.logger.log('Request received for finding all stories');
        const stories = await this.adminStoriesService.findAll();
        return stories.map(mapStoryRecordToDto);
    }
    async findOne(id) {
        this.logger.log(`Request received for finding story with ID: ${id}`);
        const story = await this.adminStoriesService.findOne(id);
        return mapStoryRecordToDto(story);
    }
    async create(createStoryDto) {
        this.logger.log('Request received to create a new story', createStoryDto);
        try {
            const newStory = await this.adminStoriesService.create(createStoryDto);
            return mapStoryRecordToDto(newStory);
        }
        catch (error) {
            this.logger.error(`Error during story creation: ${error?.message || error}`);
            throw error;
        }
    }
    async update(id, updateStoryDto) {
        this.logger.log(`Request received to update story with ID: ${id}`, updateStoryDto);
        try {
            const updatedStory = await this.adminStoriesService.update(id, updateStoryDto);
            return mapStoryRecordToDto(updatedStory);
        }
        catch (error) {
            this.logger.error(`Error during story update for ID ${id}: ${error?.message || error}`);
            throw error;
        }
    }
    async remove(id) {
        this.logger.log(`Request received to remove story with ID: ${id}`);
        try {
            await this.adminStoriesService.remove(id);
        }
        catch (error) {
            this.logger.error(`Error during story removal for ID ${id}: ${error?.message || error}`);
            throw error;
        }
    }
};
exports.AdminStoriesController = AdminStoriesController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)('admin'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminStoriesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AdminStoriesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateStoryDto]),
    __metadata("design:returntype", Promise)
], AdminStoriesController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, dto_1.UpdateStoryDto]),
    __metadata("design:returntype", Promise)
], AdminStoriesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AdminStoriesController.prototype, "remove", null);
exports.AdminStoriesController = AdminStoriesController = AdminStoriesController_1 = __decorate([
    (0, common_1.Controller)('admin/stories'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [stories_service_1.AdminStoriesService])
], AdminStoriesController);
//# sourceMappingURL=stories.controller.js.map