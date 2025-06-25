export class CombatActionRollDetailsDto {
  actorSkill: number;
  diceRoll: number;
  totalValue: number;
}

export class CombatActionDetailsDto {
  actor: 'player' | 'enemy';
  actionType:
    | 'attack'
    | 'defend'
    | 'use_item'
    | 'special_attack_charge'
    | 'special_attack_execute'
    | 'info'
    | 'victory'
    | 'defeat'
    | 'use_ability';
  description: string;
  attackerRollDetails?: CombatActionRollDetailsDto;
  defenderRollDetails?: CombatActionRollDetailsDto;
  outcome:
    | 'hit'
    | 'miss'
    | 'critical_hit'
    | 'evaded'
    | 'defended_effectively'
    | 'item_used_successfully'
    | 'item_use_failed'
    | 'charging_began'
    | 'charging_continues'
    | 'no_effect'
    | 'info'
    | 'victory'
    | 'defeat'
    | 'ability_used_successfully';
  damageDealt?: number;
  healthHealed?: number;
  targetActor?: 'player' | 'enemy';
  targetCurrentHp?: number;
  targetMaxHp?: number;
  itemIdUsed?: number;
  itemNameUsed?: string;
  currentChargeTurns?: number;
  maxChargeTurns?: number;
}
