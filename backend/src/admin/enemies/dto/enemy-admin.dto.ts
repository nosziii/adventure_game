export class EnemyAdminDto {
  id: number;
  name: string;
  health: number;
  skill: number;
  attackDescription: string | null;
  defeatText: string | null;
  itemDropId: number | null;
  xpReward: number;
  specialAttackName: string | null;
  specialAttackDamageMultiplier: number | null;
  specialAttackChargeTurns: number | null;
  specialAttackTelegraphText: string | null;
  specialAttackExecuteText: string | null;
  createdAt: Date;
  updatedAt: Date;
}
