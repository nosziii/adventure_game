export interface AbilityRecord {
    id: number;
    name: string;
    description: string;
    type: string;
    effect_string: string | null;
    talent_point_cost: number;
    level_requirement: number;
    prerequisites: any | null;
    allowed_archetype_ids: number[] | null;
    created_at: Date;
    updated_at: Date;
}
