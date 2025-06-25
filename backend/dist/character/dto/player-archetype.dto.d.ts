export declare class SimpleAbilityInfoDto {
    id: number;
    name: string;
    description: string;
    type?: string;
    effectString?: string | null;
    talentPointCost?: number;
}
export declare class PlayerArchetypeDto {
    id: number;
    name: string;
    description: string;
    iconPath: string | null;
    baseHealthBonus: number;
    baseSkillBonus: number;
    baseLuckBonus: number;
    baseStaminaBonus: number;
    baseDefenseBonus: number;
    startingAbilities: SimpleAbilityInfoDto[];
}
