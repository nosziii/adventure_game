import { Knex } from 'knex';
import { CharacterService } from '../character.service';
import { GameStateDto, CharacterStatsDto, CombatActionDto, PlayerMapDataDto, StoryInfoDto } from './dto';
import { CombatService } from '../combat.service';
export declare class GameService {
    private readonly knex;
    private readonly characterService;
    private readonly combatService;
    private readonly logger;
    constructor(knex: Knex, characterService: CharacterService, combatService: CombatService);
    private mapCharacterToDto;
    processCombatAction(userId: number, actionDto: CombatActionDto): Promise<GameStateDto>;
    getCurrentGameState(userId: number): Promise<GameStateDto>;
    private checkChoiceAvailability;
    makeChoice(userId: number, choiceId: number): Promise<GameStateDto>;
    useItemOutOfCombat(userId: number, itemId: number): Promise<CharacterStatsDto>;
    getPlayerProgress(userId: number): Promise<PlayerMapDataDto>;
    getPublishedStories(): Promise<StoryInfoDto[]>;
}
