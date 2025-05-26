import { Knex } from 'knex';
import { CharacterArchetypeRecord } from '../../game/interfaces/character-archetype-record.interface';
import { CreateArchetypeDto, UpdateArchetypeDto } from './dto';
export declare class AdminArchetypesService {
    private readonly knex;
    private readonly logger;
    constructor(knex: Knex);
    private dtoToDbArchetype;
    findAll(): Promise<CharacterArchetypeRecord[]>;
    findOne(id: number): Promise<CharacterArchetypeRecord>;
    create(createArchetypeDto: CreateArchetypeDto): Promise<CharacterArchetypeRecord>;
    update(id: number, updateArchetypeDto: UpdateArchetypeDto): Promise<CharacterArchetypeRecord>;
    remove(id: number): Promise<void>;
}
