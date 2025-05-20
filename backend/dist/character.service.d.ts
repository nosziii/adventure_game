import { Knex } from 'knex';
import { InventoryItemDto } from './game/dto/inventory-item.dto';
import { CharacterStoryProgressRecord } from './game/interfaces/character-story-progres-record.interface';
export interface Character {
    id: number;
    user_id: number;
    name: string | null;
    health: number;
    skill: number;
    luck: number | null;
    stamina: number | null;
    level: number;
    xp: number;
    xp_to_next_level: number;
    current_node_id: number | null;
    created_at: Date;
    updated_at: Date;
    defense: number | null;
    equipped_weapon_id: number | null;
    equipped_armor_id: number | null;
}
export declare class CharacterService {
    private readonly knex;
    private readonly logger;
    constructor(knex: Knex);
    findByUserId(userId: number): Promise<Character | undefined>;
    findById(id: number): Promise<Character | undefined>;
    createCharacter(userId: number): Promise<Character>;
    updateCharacter(characterId: number, updates: Partial<Omit<Character, 'id' | 'user_id' | 'created_at' | 'updated_at'>>): Promise<Character>;
    findOrCreateByUserId(userId: number): Promise<Character>;
    getInventory(characterId: number): Promise<InventoryItemDto[]>;
    equipItem(characterId: number, itemId: number): Promise<Character>;
    unequipItem(characterId: number, itemType: 'weapon' | 'armor'): Promise<Character>;
    applyPassiveEffects(character: Character): Promise<Character>;
    hasItem(characterId: number, itemId: number): Promise<boolean>;
    addItemToInventory(characterId: number, itemId: number, quantityToAdd?: number): Promise<void>;
    removeItemFromInventory(characterId: number, itemId: number, quantityToRemove?: number): Promise<boolean>;
    addXp(characterId: number, xpToAdd: number): Promise<{
        leveledUp: boolean;
        messages: string[];
    }>;
    getActiveStoryProgress(characterId: number): Promise<CharacterStoryProgressRecord | null>;
    startOrContinueStory(characterId: number, storyId: number): Promise<CharacterStoryProgressRecord>;
}
