// src/admin/stories/admin-stories.service.ts
import {
  Injectable,
  Inject,
  NotFoundException,
  Logger,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Knex } from 'knex';
import { KNEX_CONNECTION } from '../../database/database.module';
import { StoryRecord } from '../../game/interfaces/story-record.interface'; // Importáld
// DTO-kat a controller használja majd
import { CreateStoryDto, UpdateStoryDto } from './dto';

@Injectable()
export class AdminStoriesService {
  private readonly logger = new Logger(AdminStoriesService.name);

  constructor(@Inject(KNEX_CONNECTION) private readonly knex: Knex) {}

  private dtoToDbStory(
    dto: CreateStoryDto | UpdateStoryDto,
  ): Partial<Omit<StoryRecord, 'id' | 'created_at' | 'updated_at'>> {
    const dbData: any = {};
    if (dto.title !== undefined) dbData.title = dto.title;
    if (dto.description !== undefined) dbData.description = dto.description;
    if (dto.startingNodeId !== undefined)
      dbData.starting_node_id = dto.startingNodeId;
    if (dto.isPublished !== undefined) dbData.is_published = dto.isPublished;
    return dbData;
  }

  async findAll(): Promise<StoryRecord[]> {
    this.logger.log('Fetching all stories for admin');
    return this.knex<StoryRecord>('stories').select('*').orderBy('id');
  }

  async findOne(id: number): Promise<StoryRecord> {
    this.logger.log(`Workspaceing story with ID: ${id}`);
    const story = await this.knex<StoryRecord>('stories').where({ id }).first();
    if (!story) {
      this.logger.warn(`Story with ID ${id} not found.`);
      throw new NotFoundException(`Story with ID ${id} not found.`);
    }
    return story;
  }

  // ---  Story Létrehozása ---
  async create(createStoryDto: CreateStoryDto): Promise<StoryRecord> {
    this.logger.log(
      `Attempting to create new story with title: ${createStoryDto.title}`,
    );
    const dbStoryData = this.dtoToDbStory(createStoryDto);
    try {
      const [newStory] = await this.knex('stories')
        .insert(dbStoryData)
        .returning('*');
      this.logger.log(`Story created with ID: ${newStory.id}`);
      return newStory;
    } catch (error: any) {
      this.logger.error(`Failed to create story: ${error}`, error.stack);
      if (
        error.code === '23505' &&
        error.constraint === 'stories_title_unique'
      ) {
        // PostgreSQL unique violation on title
        throw new ConflictException(
          `Story with title '${createStoryDto.title}' already exists.`,
        );
      }
      if (
        error.code === '23503' &&
        error.constraint === 'stories_starting_node_id_fkey'
      ) {
        // PostgreSQL foreign key violation for starting_node_id
        throw new BadRequestException(
          'Invalid starting_node_id (node does not exist).',
        );
      }
      throw new InternalServerErrorException('Failed to create story.');
    }
  }

  // ---  Story Frissítése ---
  async update(
    id: number,
    updateStoryDto: UpdateStoryDto,
  ): Promise<StoryRecord> {
    this.logger.log(`Attempting to update story with ID: ${id}`);
    const dbStoryUpdates = this.dtoToDbStory(updateStoryDto);

    if (Object.keys(dbStoryUpdates).length === 0) {
      this.logger.warn(`Update called for story ${id} with empty data.`);
      return this.findOne(id); // Visszaadjuk a meglévőt
    }

    try {
      const [updatedStory] = await this.knex('stories')
        .where({ id })
        .update(dbStoryUpdates)
        .returning('*');
      if (!updatedStory) {
        this.logger.warn(`Story with ID ${id} not found for update.`);
        throw new NotFoundException(`Story with ID ${id} not found.`);
      }
      this.logger.log(`Story ${id} updated successfully.`);
      return updatedStory;
    } catch (error: any) {
      this.logger.error(`Failed to update story ${id}: ${error}`, error.stack);
      if (
        error.code === '23505' &&
        error.constraint === 'stories_title_unique'
      ) {
        throw new ConflictException(
          `A story with the new title might already exist.`,
        );
      }
      if (
        error.code === '23503' &&
        error.constraint === 'stories_starting_node_id_fkey'
      ) {
        throw new BadRequestException(
          'Invalid starting_node_id for update (node does not exist).',
        );
      }
      throw new InternalServerErrorException('Failed to update story.');
    }
  }

  // ---  Story Törlése ---
  async remove(id: number): Promise<void> {
    this.logger.log(`Attempting to remove story with ID: ${id}`);
    try {
      // Először ellenőrizzük, hogy van-e karakter, aki ehhez a sztorihoz van rendelve (ha lenne ilyen oszlop)
      // Jelenleg nincs közvetlen FK a characters táblából a stories-ra, ami megakadályozná a törlést,
      // de a starting_node_id miatt a story_nodes-hoz van kapcsolat.
      // A story_nodes törlésekor a RESTRICT miatt ez dobhat hibát, ha egy story használja.
      // Itt magát a story-t töröljük.
      const numDeleted = await this.knex('stories').where({ id }).del();
      if (numDeleted === 0) {
        this.logger.warn(`Story with ID ${id} not found for removal.`);
        throw new NotFoundException(`Story with ID ${id} not found.`);
      }
      this.logger.log(`Story ${id} removed successfully.`);
    } catch (error: any) {
      this.logger.error(`Failed to remove story ${id}: ${error}`, error.stack);
      // Ha a jövőben más tábla hivatkozna a stories.id-ra FK-val, itt lehetne ConflictException
      throw new InternalServerErrorException('Failed to remove story.');
    }
  }
}
