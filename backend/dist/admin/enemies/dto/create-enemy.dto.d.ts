export declare class CreateEnemyDto {
    name: string;
    health: number;
    skill: number;
    attackDescription?: string | null;
    defeatText?: string | null;
    itemDropId?: number | null;
    xpReward: number;
    specialAttackName?: string | null;
    specialAttackDamageMultiplier?: number | null;
    specialAttackChargeTurns?: number | null;
    specialAttackTelegraphText?: string | null;
    specialAttackExecuteText?: string | null;
}
