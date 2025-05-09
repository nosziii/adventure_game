import { AdminItemsService } from './items.service';
import { ItemAdminDto } from './dto';
import { CreateItemDto, UpdateItemDto } from './dto';
export declare class AdminItemsController {
    private readonly adminItemsService;
    private readonly logger;
    constructor(adminItemsService: AdminItemsService);
    findAll(): Promise<ItemAdminDto[]>;
    findOne(id: number): Promise<ItemAdminDto>;
    create(createItemDto: CreateItemDto): Promise<ItemAdminDto>;
    update(id: number, updateItemDto: UpdateItemDto): Promise<ItemAdminDto>;
    remove(id: number): Promise<void>;
}
