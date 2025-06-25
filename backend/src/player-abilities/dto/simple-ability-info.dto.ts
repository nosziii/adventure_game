export class SimpleAbilityInfoDto {
  id: number;
  name: string;
  description: string;
  // Esetleg type, effectString, ha a frontendnek szüksége van rá a gombhoz
  type?: string; // Pl. ACTIVE_COMBAT_ACTION
  effectString?: string | null; // Hogy a frontend tudjon pl. költséget mutatni
  talentPointCost?: number; // Ha a frontend kiírná a képesség eredeti költségét
}
