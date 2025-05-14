export interface EnemyRecord {
  id: number;
  name: string;
  health: number;
  skill: number;
  attack_description: string | null;
  defeat_text: string | null;
  item_drop_id: number | null;
  xp_reward: number;
  special_attack_name: string | null;
  special_attack_damage_multiplier: number | null;
  special_attack_charge_turns: number | null;
  special_attack_telegraph_text: string | null;
  special_attack_execute_text: string | null;
  created_at: Date;
  updated_at: Date;
}
