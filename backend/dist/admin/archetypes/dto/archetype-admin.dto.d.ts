export declare class ArchetypeAdminDto {
    id: number;
    name: string;
    description: string;
    iconPath: string | null;
    baseHealthBonus: number;
    baseSkillBonus: number;
    baseLuckBonus: number;
    baseStaminaBonus: number;
    baseDefenseBonus: number;
    startingAbilityIds: number[] | null;
    learnableAbilityIds: number[] | null;
    createdAt: Date;
    updatedAt: Date;
}
