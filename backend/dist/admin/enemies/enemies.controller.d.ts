import { AdminEnemiesService } from './enemies.service';
import { EnemyAdminDto, CreateEnemyDto, UpdateEnemyDto } from './dto';
export declare class AdminEnemiesController {
    private readonly adminEnemiesService;
    private readonly logger;
    constructor(adminEnemiesService: AdminEnemiesService);
    findAll(): Promise<EnemyAdminDto[]>;
    findOne(id: number): Promise<EnemyAdminDto>;
    create(createEnemyDto: CreateEnemyDto): Promise<EnemyAdminDto>;
    update(id: number, updateEnemyDto: UpdateEnemyDto): Promise<EnemyAdminDto>;
    remove(id: number): Promise<void>;
}
