export declare class CreateArchetypeDto {
    name: string;
    description: string;
    iconPath?: string | null;
    baseHealthBonus?: number;
    baseSkillBonus?: number;
    baseLuckBonus?: number;
    baseStaminaBonus?: number;
    baseDefenseBonus?: number;
    startingAbilityIds?: number[] | null;
}
