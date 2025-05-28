export interface CharacterStoryProgressRecord {
  id: number;
  character_id: number;
  story_id: number;
  current_node_id: number | null;
  health: number;
  skill: number;
  luck: number; // Feltételezve, hogy ezek not null a DB-ben defaulttal
  stamina: number;
  defense: number;
  level: number;
  xp: number;
  xp_to_next_level: number;
  equipped_weapon_id: number | null;
  equipped_armor_id: number | null;
  last_played_at: Date;
  is_active: boolean;
  talent_points_available: number;
  selected_archetype_id: number | null;
  created_at: Date;
  updated_at: Date;
}
