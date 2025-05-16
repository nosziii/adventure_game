import { Knex } from 'knex';
import { CharacterService, Character } from './character.service';
import { CombatActionDto } from './game/dto/combat-action.dto';
import { EnemyDataDto } from './game/dto';
import { CombatActionDetailsDto } from './combat/dto/combat-action-details.dto';
export interface CombatResult {
    character: Character;
    enemy?: EnemyDataDto;
    roundActions: CombatActionDetailsDto[];
    isCombatOver: boolean;
    nextNodeId?: number;
}
export declare class CombatService {
    private readonly knex;
    private readonly characterService;
    private readonly logger;
    constructor(knex: Knex, characterService: CharacterService);
    private _resolvePlayerAttack;
    private _resolvePlayerItemUse;
    private _resolvePlayerDefend;
    private _resolveEnemyAction;
    handleCombatAction(userId: number, actionDto: CombatActionDto): Promise<CombatResult>;
}
