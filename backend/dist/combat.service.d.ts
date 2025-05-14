import { Knex } from 'knex';
import { CharacterService, Character } from './character.service';
import { CombatActionDto } from './game/dto/combat-action.dto';
import { EnemyDataDto } from './game/dto';
export interface CombatResult {
    character: Character;
    enemy?: EnemyDataDto;
    combatLogMessages: string[];
    isCombatOver: boolean;
    nextNodeId?: number;
}
export declare class CombatService {
    private readonly knex;
    private readonly characterService;
    private readonly logger;
    constructor(knex: Knex, characterService: CharacterService);
    handleCombatAction(userId: number, actionDto: CombatActionDto): Promise<CombatResult>;
}
