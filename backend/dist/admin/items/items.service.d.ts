import { Knex } from 'knex';
import { ItemRecord } from '../../game/interfaces/item-record.interface';
import { CreateItemDto, UpdateItemDto } from './dto';
export declare class AdminItemsService {
    private readonly knex;
    private readonly logger;
    constructor(knex: Knex);
    findAll(): Promise<ItemRecord[]>;
    findOne(id: number): Promise<ItemRecord>;
    create(createItemDto: CreateItemDto): Promise<ItemRecord>;
    update(id: number, updateItemDto: UpdateItemDto): Promise<ItemRecord>;
    remove(id: number): Promise<void>;
}
