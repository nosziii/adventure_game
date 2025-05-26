// src/character/dto/player-archetype.dto.ts
// Szükség lesz egy egyszerűsített Ability DTO-ra is
export class SimpleAbilityInfoDto {
  id: number;
  name: string;
  description: string;
}

export class PlayerArchetypeDto {
  id: number;
  name: string;
  description: string;
  iconPath: string | null;
  // Stat bónuszok, hogy a játékos lássa, mit kap
  baseHealthBonus: number;
  baseSkillBonus: number;
  baseLuckBonus: number;
  baseStaminaBonus: number;
  baseDefenseBonus: number;
  startingAbilities: SimpleAbilityInfoDto[]; // A kezdő képességek részletei
}
