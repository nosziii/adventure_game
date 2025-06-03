export interface StoryNode {
  id: number;
  text: string;
  image: string | null;
  is_end: boolean;
  health_effect: number | null;
  item_reward_id: number | null;
  enemy_id: number | null;
  victory_node_id: number | null;
  defeat_node_id: number | null;
  created_at: Date;
  updated_at: Date;
}
