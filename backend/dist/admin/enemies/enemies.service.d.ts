import { Knex } from 'knex';
import { EnemyRecord } from '../../game/interfaces/enemy-record.interface';
import { CreateEnemyDto, UpdateEnemyDto } from './dto';
export declare class AdminEnemiesService {
    private readonly knex;
    private readonly logger;
    constructor(knex: Knex);
    private dtoToDbEnemy;
    findAll(): Promise<EnemyRecord[]>;
    findOne(id: number): Promise<EnemyRecord>;
    create(createEnemyDto: CreateEnemyDto): Promise<EnemyRecord>;
    update(id: number, updateEnemyDto: UpdateEnemyDto): Promise<EnemyRecord>;
    remove(id: number): Promise<void>;
}
