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
var AdminStoriesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminStoriesService = void 0;
const common_1 = require("@nestjs/common");
const knex_1 = require("knex");
const database_module_1 = require("../../database/database.module");
let AdminStoriesService = AdminStoriesService_1 = class AdminStoriesService {
    knex;
    logger = new common_1.Logger(AdminStoriesService_1.name);
    constructor(knex) {
        this.knex = knex;
    }
    dtoToDbStory(dto) {
        const dbData = {};
        if (dto.title !== undefined)
            dbData.title = dto.title;
        if (dto.description !== undefined)
            dbData.description = dto.description;
        if (dto.startingNodeId !== undefined)
            dbData.starting_node_id = dto.startingNodeId;
        if (dto.isPublished !== undefined)
            dbData.is_published = dto.isPublished;
        return dbData;
    }
    async findAll() {
        this.logger.log('Fetching all stories for admin');
        return this.knex('stories').select('*').orderBy('id');
    }
    async findOne(id) {
        this.logger.log(`Workspaceing story with ID: ${id}`);
        const story = await this.knex('stories').where({ id }).first();
        if (!story) {
            this.logger.warn(`Story with ID ${id} not found.`);
            throw new common_1.NotFoundException(`Story with ID ${id} not found.`);
        }
        return story;
    }
    async create(createStoryDto) {
        this.logger.log(`Attempting to create new story with title: ${createStoryDto.title}`);
        const dbStoryData = this.dtoToDbStory(createStoryDto);
        try {
            const [newStory] = await this.knex('stories')
                .insert(dbStoryData)
                .returning('*');
            this.logger.log(`Story created with ID: ${newStory.id}`);
            return newStory;
        }
        catch (error) {
            this.logger.error(`Failed to create story: ${error}`, error.stack);
            if (error.code === '23505' &&
                error.constraint === 'stories_title_unique') {
                throw new common_1.ConflictException(`Story with title '${createStoryDto.title}' already exists.`);
            }
            if (error.code === '23503' &&
                error.constraint === 'stories_starting_node_id_fkey') {
                throw new common_1.BadRequestException('Invalid starting_node_id (node does not exist).');
            }
            throw new common_1.InternalServerErrorException('Failed to create story.');
        }
    }
    async update(id, updateStoryDto) {
        this.logger.log(`Attempting to update story with ID: ${id}`);
        const dbStoryUpdates = this.dtoToDbStory(updateStoryDto);
        if (Object.keys(dbStoryUpdates).length === 0) {
            this.logger.warn(`Update called for story ${id} with empty data.`);
            return this.findOne(id);
        }
        try {
            const [updatedStory] = await this.knex('stories')
                .where({ id })
                .update(dbStoryUpdates)
                .returning('*');
            if (!updatedStory) {
                this.logger.warn(`Story with ID ${id} not found for update.`);
                throw new common_1.NotFoundException(`Story with ID ${id} not found.`);
            }
            this.logger.log(`Story ${id} updated successfully.`);
            return updatedStory;
        }
        catch (error) {
            this.logger.error(`Failed to update story ${id}: ${error}`, error.stack);
            if (error.code === '23505' &&
                error.constraint === 'stories_title_unique') {
                throw new common_1.ConflictException(`A story with the new title might already exist.`);
            }
            if (error.code === '23503' &&
                error.constraint === 'stories_starting_node_id_fkey') {
                throw new common_1.BadRequestException('Invalid starting_node_id for update (node does not exist).');
            }
            throw new common_1.InternalServerErrorException('Failed to update story.');
        }
    }
    async remove(id) {
        this.logger.log(`Attempting to remove story with ID: ${id}`);
        try {
            const numDeleted = await this.knex('stories').where({ id }).del();
            if (numDeleted === 0) {
                this.logger.warn(`Story with ID ${id} not found for removal.`);
                throw new common_1.NotFoundException(`Story with ID ${id} not found.`);
            }
            this.logger.log(`Story ${id} removed successfully.`);
        }
        catch (error) {
            this.logger.error(`Failed to remove story ${id}: ${error}`, error.stack);
            throw new common_1.InternalServerErrorException('Failed to remove story.');
        }
    }
};
exports.AdminStoriesService = AdminStoriesService;
exports.AdminStoriesService = AdminStoriesService = AdminStoriesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(database_module_1.KNEX_CONNECTION)),
    __metadata("design:paramtypes", [Function])
], AdminStoriesService);
//# sourceMappingURL=stories.service.js.map