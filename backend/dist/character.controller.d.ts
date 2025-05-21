import { CharacterService } from './character.service';
import { CharacterStatsDto } from './game/dto/character-stats.dto';
import { GameService } from './game/game.service';
import { GameStateDto } from './game/dto/game-state.dto';
declare class EquipItemDto {
    itemId: number;
}
declare class UnequipItemDto {
    itemType: 'weapon' | 'armor';
}
export declare class CharacterController {
    private readonly characterService;
    private readonly gameService;
    private readonly logger;
    constructor(characterService: CharacterService, gameService: GameService);
    equipItem(req: any, body: EquipItemDto): Promise<CharacterStatsDto>;
    unequip(req: any, body: UnequipItemDto): Promise<CharacterStatsDto>;
    startStory(req: any, storyId: number): Promise<GameStateDto>;
}
export {};
