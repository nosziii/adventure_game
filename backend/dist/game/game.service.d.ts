import { Knex } from 'knex';
import { CharacterService } from '../character.service';
import { GameStateDto, CharacterStatsDto, CombatActionDto, PlayerMapDataDto } from './dto';
export declare class GameService {
    private readonly knex;
    private readonly characterService;
    private readonly logger;
    constructor(knex: Knex, characterService: CharacterService);
    private mapCharacterToDto;
    getCurrentGameState(userId: number): Promise<GameStateDto>;
    private checkChoiceAvailability;
    makeChoice(userId: number, choiceId: number): Promise<GameStateDto>;
    handleCombatAction(userId: number, actionDto: CombatActionDto): Promise<GameStateDto>;
    useItemOutOfCombat(userId: number, itemId: number): Promise<CharacterStatsDto>;
    getPlayerProgress(userId: number): Promise<PlayerMapDataDto>;
}
