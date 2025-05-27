import { CharacterService } from './character.service';
import { CharacterStatsDto } from './game/dto/character-stats.dto';
import { GameService } from './game/game.service';
import { GameStateDto } from './game/dto';
import { SelectArchetypeDto, PlayerArchetypeDto, SpendTalentPointDto, BeginStoryWithArchetypeDto } from './character/dto';
import { UserDto } from './auth/dto/user.dto';
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
    beginNewPlaythrough(req: any, storyId: number, body: BeginStoryWithArchetypeDto): Promise<GameStateDto>;
    resetStory(req: any, storyId: number): Promise<void>;
    spendTalentPoint(req: any, spendTalentPointDto: SpendTalentPointDto): Promise<GameStateDto>;
    listSelectableArchetypes(): Promise<PlayerArchetypeDto[]>;
    selectArchetype(req: any, selectArchetypeDto: SelectArchetypeDto): Promise<UserDto>;
}
export {};
