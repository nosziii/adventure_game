export class AbilityAdminDto {
  id: number;
  name: string;
  description: string;
  type: string; // 'PASSIVE_STAT', 'ACTIVE_COMBAT_ACTION', 'PASSIVE_COMBAT_MODIFIER'
  effectString: string | null;
  talentPointCost: number;
  levelRequirement: number;
  prerequisites: any | null; // JSONB, lehet string[] vagy number[] vagy komplexebb
  createdAt: Date;
  updatedAt: Date;
}
