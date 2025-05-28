export interface CharacterArchetypeRecord {
    id: number;
    name: string;
    description: string;
    icon_path: string | null;
    base_health_bonus: number;
    base_skill_bonus: number;
    base_luck_bonus: number;
    base_stamina_bonus: number;
    base_defense_bonus: number;
    starting_ability_ids: number[] | null;
    learnable_ability_ids: number[] | null;
    created_at: Date;
    updated_at: Date;
}
