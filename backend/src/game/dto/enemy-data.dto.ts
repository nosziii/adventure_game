export class EnemyDataDto {
  id: number;
  name: string;
  health: number;
  skill?: number;
  currentHealth: number;
  isChargingSpecial?: boolean;
  currentChargeTurns?: number | null;
  maxChargeTurns?: number | null;
  specialAttackTelegraphText?: string | null;
}
