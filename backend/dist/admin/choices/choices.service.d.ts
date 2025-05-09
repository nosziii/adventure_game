import { Knex } from 'knex';
import { ChoiceRecord } from '../../game/interfaces/choice-record.interface';
import { CreateChoiceDto, UpdateChoiceDto } from './dto';
export declare class AdminChoicesService {
    private readonly knex;
    private readonly logger;
    constructor(knex: Knex);
    private dtoToDbChoice;
    findAll(sourceNodeId?: number): Promise<ChoiceRecord[]>;
    findOne(id: number): Promise<ChoiceRecord>;
    create(createChoiceDto: CreateChoiceDto): Promise<ChoiceRecord>;
    update(id: number, updateChoiceDto: UpdateChoiceDto): Promise<ChoiceRecord>;
    remove(id: number): Promise<void>;
}
