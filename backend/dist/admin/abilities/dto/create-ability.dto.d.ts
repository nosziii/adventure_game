export declare enum AbilityType {
    PASSIVE_STAT = "PASSIVE_STAT",
    ACTIVE_COMBAT_ACTION = "ACTIVE_COMBAT_ACTION",
    PASSIVE_COMBAT_MODIFIER = "PASSIVE_COMBAT_MODIFIER"
}
export declare class CreateAbilityDto {
    name: string;
    description: string;
    type: AbilityType;
    effectString?: string | null;
    talentPointCost: number;
    levelRequirement: number;
    prerequisites?: any | null;
}
