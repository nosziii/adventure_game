import { CharacterService } from './character.service';
import { CharacterStatsDto } from './game/dto/character-stats.dto';
declare class EquipItemDto {
    itemId: number;
}
declare class UnequipItemDto {
    itemType: 'weapon' | 'armor';
}
export declare class CharacterController {
    private readonly characterService;
    private readonly logger;
    constructor(characterService: CharacterService);
    equipItem(req: any, body: EquipItemDto): Promise<CharacterStatsDto>;
    unequipItem(req: any, body: UnequipItemDto): Promise<CharacterStatsDto>;
}
export {};
