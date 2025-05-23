// src/game/interfaces/ability-record.interface.ts
export interface AbilityRecord {
  id: number;
  name: string;
  description: string;
  type: string; // PASSIVE_STAT, ACTIVE_COMBAT_ACTION, etc.
  effect_string: string | null;
  talent_point_cost: number;
  level_requirement: number;
  prerequisites: any | null; // JSONB-ként tárolva
  created_at: Date;
  updated_at: Date;
}
