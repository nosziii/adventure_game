export class ItemAdminDto {
  id: number;
  name: string;
  description: string | null;
  type: string; // pl. 'weapon', 'potion', 'key', 'armor'
  effect: string | null; // pl. 'skill+2;damage+5', 'heal+30'
  usable: boolean;
  createdAt: Date; // Vagy string
  updatedAt: Date; // Vagy string
}
