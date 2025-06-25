import { ChoiceDto } from './choice.dto';
import { EnemyDataDto } from './enemy-data.dto';
import { CharacterStatsDto } from './character-stats.dto';
import { InventoryItemDto } from './inventory-item.dto';
import { CombatActionDetailsDto } from '../../combat/dto/combat-action-details.dto';
import { SimpleAbilityInfoDto } from '../../character/dto/player-archetype.dto';
interface StoryNodeData {
    id: number;
    text: string;
    image: string | null;
    is_end?: boolean;
}
export declare class GameStateDto {
    node: StoryNodeData | null;
    choices: ChoiceDto[];
    character: CharacterStatsDto;
    combat: EnemyDataDto | null;
    roundActions?: CombatActionDetailsDto[] | null;
    inventory: InventoryItemDto[] | null;
    equippedWeaponId?: number | null;
    equippedArmorId?: number | null;
    messages?: string[];
    availableCombatAbilities?: SimpleAbilityInfoDto[] | null;
}
export {};
