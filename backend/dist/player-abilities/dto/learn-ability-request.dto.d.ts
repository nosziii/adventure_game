export declare class LearnableAbilityDto {
    id: number;
    name: string;
    description: string;
    type: string;
    effectString: string | null;
    talentPointCost: number;
    levelRequirement: number;
    prerequisites: number[] | null;
    canLearn: boolean;
    reasonCantLearn?: string;
    isAlreadyLearned: boolean;
}
