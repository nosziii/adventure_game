export interface PlayerProgressRecord {
  id: number;
  character_id: number;
  node_id: number;
  choice_id_taken: number | null;
  visited_at: Date;
}
