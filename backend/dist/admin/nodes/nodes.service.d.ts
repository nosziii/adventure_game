import { Knex } from 'knex';
import { StoryNode } from '../../game/interfaces/story-node.interface';
import { CreateNodeDto, UpdateNodeDto } from './dto';
export declare class AdminNodesService {
    private readonly knex;
    private readonly logger;
    constructor(knex: Knex);
    private dtoToDbNode;
    findAll(): Promise<StoryNode[]>;
    findOne(id: number): Promise<StoryNode>;
    create(createNodeDto: CreateNodeDto): Promise<StoryNode>;
    update(id: number, updateNodeDto: UpdateNodeDto): Promise<StoryNode>;
    remove(id: number): Promise<void>;
}
