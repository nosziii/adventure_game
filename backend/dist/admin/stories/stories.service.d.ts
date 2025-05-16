import { Knex } from 'knex';
import { StoryRecord } from '../../game/interfaces/story-record.interface';
import { CreateStoryDto, UpdateStoryDto } from './dto';
export declare class AdminStoriesService {
    private readonly knex;
    private readonly logger;
    constructor(knex: Knex);
    private dtoToDbStory;
    findAll(): Promise<StoryRecord[]>;
    findOne(id: number): Promise<StoryRecord>;
    create(createStoryDto: CreateStoryDto): Promise<StoryRecord>;
    update(id: number, updateStoryDto: UpdateStoryDto): Promise<StoryRecord>;
    remove(id: number): Promise<void>;
}
