export class CharacterStatsDto {
  health: number;
  skill: number;
  luck: number | null;
  stamina: number | null;
  name?: string | null;
  level: number;
  xp: number;
  xpToNextLevel: number;
  defense: number | null;
}
