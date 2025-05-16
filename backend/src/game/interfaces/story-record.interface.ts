export interface StoryRecord {
  id: number;
  title: string;
  description: string | null;
  starting_node_id: number;
  is_published: boolean;
  created_at: Date;
  updated_at: Date;
}
