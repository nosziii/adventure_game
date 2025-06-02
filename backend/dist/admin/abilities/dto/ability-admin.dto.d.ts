export declare class AbilityAdminDto {
    id: number;
    name: string;
    description: string;
    type: string;
    effectString: string | null;
    talentPointCost: number;
    levelRequirement: number;
    prerequisites: any | null;
    allowedArchetypeIds: number[] | null;
    createdAt: Date;
    updatedAt: Date;
}
