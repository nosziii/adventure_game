import { AdminAbilitiesService } from './abilities.service';
import { AbilityAdminDto, CreateAbilityDto, UpdateAbilityDto } from './dto';
export declare class AdminAbilitiesController {
    private readonly adminAbilitiesService;
    private readonly logger;
    constructor(adminAbilitiesService: AdminAbilitiesService);
    findAll(): Promise<AbilityAdminDto[]>;
    findOne(id: number): Promise<AbilityAdminDto>;
    create(createAbilityDto: CreateAbilityDto): Promise<AbilityAdminDto>;
    update(id: number, updateAbilityDto: UpdateAbilityDto): Promise<AbilityAdminDto>;
    remove(id: number): Promise<void>;
}
