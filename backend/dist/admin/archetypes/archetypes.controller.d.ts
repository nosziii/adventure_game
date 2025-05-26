import { AdminArchetypesService } from './archetypes.service';
import { ArchetypeAdminDto, CreateArchetypeDto, UpdateArchetypeDto } from './dto';
export declare class AdminArchetypesController {
    private readonly adminArchetypesService;
    private readonly logger;
    constructor(adminArchetypesService: AdminArchetypesService);
    findAll(): Promise<ArchetypeAdminDto[]>;
    findOne(id: number): Promise<ArchetypeAdminDto>;
    create(createArchetypeDto: CreateArchetypeDto): Promise<ArchetypeAdminDto>;
    update(id: number, updateArchetypeDto: UpdateArchetypeDto): Promise<ArchetypeAdminDto>;
    remove(id: number): Promise<void>;
}
