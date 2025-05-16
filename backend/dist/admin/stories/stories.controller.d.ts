import { AdminStoriesService } from './stories.service';
import { StoryAdminDto, CreateStoryDto, UpdateStoryDto } from './dto';
export declare class AdminStoriesController {
    private readonly adminStoriesService;
    private readonly logger;
    constructor(adminStoriesService: AdminStoriesService);
    findAll(): Promise<StoryAdminDto[]>;
    findOne(id: number): Promise<StoryAdminDto>;
    create(createStoryDto: CreateStoryDto): Promise<StoryAdminDto>;
    update(id: number, updateStoryDto: UpdateStoryDto): Promise<StoryAdminDto>;
    remove(id: number): Promise<void>;
}
