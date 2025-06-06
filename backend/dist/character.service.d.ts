import { Knex } from 'knex';
import { InventoryItemDto } from './game/dto/inventory-item.dto';
import type { CharacterStoryProgressRecord } from './game/interfaces/character-story-progres-record.interface';
import { SpendableStatName, PlayerArchetypeDto } from './character/dto';
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
    talent_points_available: number | null;
    equipped_weapon_id: number | null;
    equipped_armor_id: number | null;
    selected_archetype_id: number | null;
}
export declare class CharacterService {
    private readonly knex;
    private readonly logger;
    constructor(knex: Knex);
    getHydratedCharacterForStory(baseCharacterId: number, activeStoryProgressId?: number): Promise<Character | null>;
    findByUserId(userId: number): Promise<Character | undefined>;
    findById(id: number): Promise<Character | undefined>;
    getStoryInventory(progressId: number): Promise<InventoryItemDto[]>;
    hasStoryItem(progressId: number, itemId: number, quantity?: number): Promise<boolean>;
    addStoryItem(progressId: number, itemId: number, quantity?: number): Promise<void>;
    removeStoryItem(progressId: number, itemId: number, quantity?: number): Promise<boolean>;
    updateStoryProgress(progressId: number, updates: Partial<Omit<CharacterStoryProgressRecord, 'id' | 'character_id' | 'story_id' | 'created_at' | 'updated_at'>>, trx?: Knex.Transaction): Promise<CharacterStoryProgressRecord>;
    createCharacter(userId: number): Promise<Character>;
    updateCharacter(characterId: number, updates: Partial<Omit<Character, 'id' | 'user_id' | 'created_at' | 'updated_at'>>): Promise<Character>;
    equipItem(characterId: number, itemId: number): Promise<CharacterStoryProgressRecord>;
    unequipItem(characterId: number, itemType: 'weapon' | 'armor'): Promise<CharacterStoryProgressRecord>;
    applyPassiveEffects(character: Character, storyProgressId?: number): Promise<Character>;
    resetStoryProgress(characterId: number, storyId: number): Promise<void>;
    addXp(characterId: number, xpToAdd: number): Promise<{
        leveledUp: boolean;
        messages: string[];
        updatedProgress?: CharacterStoryProgressRecord;
    }>;
    getActiveStoryProgress(characterId: number): Promise<CharacterStoryProgressRecord | null>;
    startOrContinueStory(characterId: number, storyId: number): Promise<CharacterStoryProgressRecord>;
    spendTalentPointOnStat(characterId: number, statName: SpendableStatName): Promise<CharacterStoryProgressRecord>;
    findOrCreateByUserId(userId: number): Promise<Character>;
    setActiveStory(characterId: number, storyId: number): Promise<CharacterStoryProgressRecord | null>;
    beginNewStoryPlaythrough(characterId: number, storyId: number, archetypeId: number): Promise<CharacterStoryProgressRecord>;
    getSelectableArchetypes(): Promise<PlayerArchetypeDto[]>;
    selectArchetypeForCharacter(characterId: number, archetypeId: number): Promise<Character>;
}
