export interface User {
  id: number;
  email: string;
  role: string; // 'admin' vagy 'user'
  selected_archetype_id: number | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SimpleAbilityInfoDto {
  id: number;
  name: string;
  description: string;
}

export interface SimpleAbilityInfo {
  // Korábban SimpleAbilityInfoDto volt a backend DTO neve
  id: number;
  name: string;
  description: string;
}

export interface ArchetypeForSelection {
  // Korábban PlayerArchetypeDto volt a backend DTO neve
  id: number;
  name: string;
  description: string;
  iconPath: string | null;
  baseHealthBonus: number;
  baseSkillBonus: number;
  baseLuckBonus: number;
  baseStaminaBonus: number;
  baseDefenseBonus: number;
  startingAbilities: SimpleAbilityInfo[];
}

export interface PlayerArchetypeDto {
  id: number;
  name: string;
  description: string;
  iconPath: string | null;
  baseHealthBonus: number;
  baseSkillBonus: number;
  baseLuckBonus: number;
  baseStaminaBonus: number;
  baseDefenseBonus: number;
  startingAbilities: SimpleAbilityInfoDto[];
}

export interface AuthState {
  token: string | null;
  user: User | null; // Most már tartalmazza a selected_archetype_id-t
  isLoadingUser: boolean;
  loginError: string | null;
  registerError: string | null;
  availableArchetypes: ArchetypeForSelection[]; // <-- ÚJ
  isLoadingArchetypes: boolean; // <-- ÚJ
  archetypeSelectionError: string | null;
}
