export interface CombatActionRollDetailsDto {
  actorSkill: number;
  diceRoll: number;
  totalValue: number;
}

export interface CombatActionDetailsDto {
  actor: 'player' | 'enemy'; // Ki hajtotta végre
  actionType:
    | 'attack'
    | 'defend'
    | 'use_item'
    | 'special_attack_charge'
    | 'special_attack_execute';
  description: string; // Pl. "Játékos támad Karddal!", "Ogre készül a Bunkócsapásra!"
  attackerRollDetails?: CombatActionRollDetailsDto; // Támadó dobása
  defenderRollDetails?: CombatActionRollDetailsDto; // Védekező dobása (ha volt összehasonlítás)
  outcome:
    | 'hit'
    | 'miss'
    | 'critical_hit'
    | 'evaded'
    | 'defended'
    | 'item_used'
    | 'charging'
    | 'no_effect';
  damageDealt?: number; // Ha volt sebzés
  healthHealed?: number; // Ha volt gyógyítás
  targetCurrentHp?: number; // Célpont új HP-ja
  targetMaxHp?: number; // Célpont max HP-ja
  // Ide jöhetnek még specifikus adatok, pl. használt tárgy neve
}
