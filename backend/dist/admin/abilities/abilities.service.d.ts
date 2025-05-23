import { Knex } from 'knex';
import { AbilityRecord } from '../../game/interfaces/ability-record.interface';
import { CreateAbilityDto, UpdateAbilityDto } from './dto';
export declare class AdminAbilitiesService {
    private readonly knex;
    private readonly logger;
    constructor(knex: Knex);
    private dtoToDbAbility;
    findAll(): Promise<AbilityRecord[]>;
    findOne(id: number): Promise<AbilityRecord>;
    create(createAbilityDto: CreateAbilityDto): Promise<AbilityRecord>;
    update(id: number, updateAbilityDto: UpdateAbilityDto): Promise<AbilityRecord>;
    remove(id: number): Promise<void>;
}
