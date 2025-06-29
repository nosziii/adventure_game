export class NodeDto {
  id: number;
  text: string;
  image: string | null;
  is_end: boolean;
  health_effect: number | null;
  item_reward_id: number | null;
  enemy_id: number | null;
  victoryNodeId: number | null;
  defeatNodeId: number | null;
  created_at: Date;
  updated_at: Date;
}
