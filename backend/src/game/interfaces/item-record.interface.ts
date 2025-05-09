export interface ItemRecord {
  id: number;
  name: string;
  description: string | null;
  type: string;
  effect: string | null;
  usable: boolean;
  created_at: Date;
  updated_at: Date;
}
