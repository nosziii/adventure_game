// src/admin/stories/admin-stories.controller.ts
import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
  Logger,
  NotFoundException,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Patch,
  Delete,
} from '@nestjs/common';
import { AdminStoriesService } from './stories.service';
import { StoryAdminDto, CreateStoryDto, UpdateStoryDto } from './dto'; // Használjuk az index exportot
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../auth/guards/roles.guard'; // Igazítsd az útvonalat!
import { Roles } from '../../auth/decorators/roles.decorator'; // Igazítsd az útvonalat!
import { StoryRecord } from '../../game/interfaces/story-record.interface';

// Helper a mappoláshoz (DB StoryRecord -> StoryAdminDto)
const mapStoryRecordToDto = (story: StoryRecord): StoryAdminDto => {
  if (!story)
    throw new NotFoundException('Story record not found for mapping.');
  return {
    id: story.id,
    title: story.title,
    description: story.description,
    startingNodeId: story.starting_node_id, // snake_case -> camelCase
    isPublished: story.is_published, // snake_case -> camelCase
    createdAt: story.created_at,
    updatedAt: story.updated_at,
  };
};

@Controller('admin/stories')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class AdminStoriesController {
  private readonly logger = new Logger(AdminStoriesController.name);

  constructor(private readonly adminStoriesService: AdminStoriesService) {}

  @Get()
  @Roles('admin')
  async findAll(): Promise<StoryAdminDto[]> {
    this.logger.log('Request received for finding all stories');
    const stories = await this.adminStoriesService.findAll();
    return stories.map(mapStoryRecordToDto);
  }

  @Get(':id')
  @Roles('admin')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<StoryAdminDto> {
    this.logger.log(`Request received for finding story with ID: ${id}`);
    const story = await this.adminStoriesService.findOne(id);
    return mapStoryRecordToDto(story);
  }

  // --- Create Végpont ---
  @Post()
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createStoryDto: CreateStoryDto): Promise<StoryAdminDto> {
    this.logger.log('Request received to create a new story', createStoryDto);
    try {
      const newStory = await this.adminStoriesService.create(createStoryDto);
      return mapStoryRecordToDto(newStory);
    } catch (error) {
      this.logger.error(
        `Error during story creation: ${error?.message || error}`,
      );
      throw error; // A service már a megfelelő HTTP hibát dobja
    }
  }

  // --- Update Végpont ---
  @Patch(':id')
  @Roles('admin')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStoryDto: UpdateStoryDto,
  ): Promise<StoryAdminDto> {
    this.logger.log(
      `Request received to update story with ID: ${id}`,
      updateStoryDto,
    );
    try {
      const updatedStory = await this.adminStoriesService.update(
        id,
        updateStoryDto,
      );
      return mapStoryRecordToDto(updatedStory);
    } catch (error) {
      this.logger.error(
        `Error during story update for ID ${id}: ${error?.message || error}`,
      );
      throw error;
    }
  }

  // --- Delete Végpont ---
  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    this.logger.log(`Request received to remove story with ID: ${id}`);
    try {
      await this.adminStoriesService.remove(id);
    } catch (error) {
      this.logger.error(
        `Error during story removal for ID ${id}: ${error?.message || error}`,
      );
      throw error;
    }
  }
}
