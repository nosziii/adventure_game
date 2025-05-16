export interface CombatActionRollDetailsDto {
    actorSkill: number;
    diceRoll: number;
    totalValue: number;
}
export interface CombatActionDetailsDto {
    actor: 'player' | 'enemy';
    actionType: 'attack' | 'defend' | 'use_item' | 'special_attack_charge' | 'special_attack_execute';
    description: string;
    attackerRollDetails?: CombatActionRollDetailsDto;
    defenderRollDetails?: CombatActionRollDetailsDto;
    outcome: 'hit' | 'miss' | 'critical_hit' | 'evaded' | 'defended' | 'item_used' | 'charging' | 'no_effect';
    damageDealt?: number;
    healthHealed?: number;
    targetCurrentHp?: number;
    targetMaxHp?: number;
}
