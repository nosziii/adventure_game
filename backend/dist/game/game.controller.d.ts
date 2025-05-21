import { GameService } from './game.service';
import { GameStateDto, MakeChoiceDto, UseItemDto, CharacterStatsDto, CombatActionDto, PlayerMapDataDto, PlayerStoryListItemDto } from './dto';
export declare class GameController {
    private readonly gameService;
    private readonly logger;
    constructor(gameService: GameService);
    getGameState(req: any): Promise<GameStateDto>;
    makeChoice(req: any, makeChoiceDto: MakeChoiceDto): Promise<GameStateDto>;
    handleCombatAction(req: any, combatActionDto: CombatActionDto): Promise<GameStateDto>;
    useItem(req: any, useItemDto: UseItemDto): Promise<CharacterStatsDto>;
    getPlayerMapProgress(req: any): Promise<PlayerMapDataDto>;
    listPublishedStories(req: any): Promise<PlayerStoryListItemDto[]>;
}
