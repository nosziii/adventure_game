export class LearnableAbilityDto {
  id: number;
  name: string;
  description: string;
  type: string; // Pl. 'PASSIVE_STAT', 'ACTIVE_COMBAT_ACTION'
  effectString: string | null;
  talentPointCost: number;
  levelRequirement: number;
  prerequisites: number[] | null; // Az előfeltétel képességek ID-jai
  canLearn: boolean; // A játékos jelenleg meg tudja-e tanulni
  reasonCantLearn?: string; // Ha nem, miért
  isAlreadyLearned: boolean;
}
