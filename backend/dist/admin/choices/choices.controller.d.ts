import { AdminChoicesService } from './choices.service';
import { ChoiceAdminDto, CreateChoiceDto, UpdateChoiceDto } from './dto';
export declare class AdminChoicesController {
    private readonly adminChoicesService;
    private readonly logger;
    constructor(adminChoicesService: AdminChoicesService);
    findAll(sourceNodeId?: number): Promise<ChoiceAdminDto[]>;
    findOne(id: number): Promise<ChoiceAdminDto>;
    create(createChoiceDto: CreateChoiceDto): Promise<ChoiceAdminDto>;
    update(id: number, updateChoiceDto: UpdateChoiceDto): Promise<ChoiceAdminDto>;
    remove(id: number): Promise<void>;
}
