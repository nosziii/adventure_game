import { AdminNodesService } from './nodes.service';
import { NodeDto, CreateNodeDto, UpdateNodeDto } from './dto';
export declare class AdminNodesController {
    private readonly adminNodesService;
    private readonly logger;
    constructor(adminNodesService: AdminNodesService);
    findAll(): Promise<NodeDto[]>;
    findOne(id: number): Promise<NodeDto>;
    create(createNodeDto: CreateNodeDto): Promise<NodeDto>;
    update(id: number, updateNodeDto: UpdateNodeDto): Promise<NodeDto>;
    remove(id: number): Promise<void>;
}
