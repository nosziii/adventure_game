// A Story Node megjelenítéséhez és listázásához szükséges adatok
export interface AdminNodeData {
  id: number;
  text: string;
  image: string | null;
  is_end: boolean;
  health_effect: number | null;
  item_reward_id: number | null;
  enemy_id: number | null;
  created_at: string; // A backend Date-t küld, de az Axios/JSON stringgé alakíthatja
  updated_at: string; // Fontos lehet a Date objektummá alakítás a frontend oldalon, ha szükséges
}

// Node létrehozásához küldendő adatok
export interface AdminCreateNodePayload {
  text: string;
  image?: string | null;
  is_end?: boolean;
  health_effect?: number | null;
  item_reward_id?: number | null;
  enemy_id?: number | null;
}

// Choice adatok az admin listához és szerkesztéshez
export interface AdminChoiceData {
  id: number;
  sourceNodeId: number;
  targetNodeId: number;
  text: string;
  requiredItemId: number | null;
  itemCostId: number | null;
  requiredStatCheck: string | null;
  createdAt: string; // Vagy Date
  updatedAt: string; // Vagy Date
}

// Choice létrehozásához payload
export interface AdminCreateChoicePayload {
  sourceNodeId: number;
  targetNodeId: number;
  text: string;
  requiredItemId?: number | null;
  itemCostId?: number | null;
  requiredStatCheck?: string | null;
}

export interface AdminItemData {
  id: number;
  name: string;
  description: string | null;
  type: string;
  effect: string | null;
  usable: boolean;
  createdAt: string; // Vagy Date
  updatedAt: string; // Vagy Date
}

// Item létrehozásához payload
export interface AdminCreateItemPayload {
  name: string;
  description?: string | null;
  type: string;
  effect?: string | null;
  usable?: boolean;
}

export interface AdminEnemyData {
  id: number;
  name: string;
  health: number;
  skill: number;
  attackDescription: string | null;
  defeatText: string | null;
  itemDropId: number | null;
  xpReward: number;
  specialAttackName: string | null;
  specialAttackDamageMultiplier: number | null;
  specialAttackChargeTurns: number | null;
  specialAttackTelegraphText: string | null;
  specialAttackExecuteText: string | null;
  createdAt: string; // Vagy Date
  updatedAt: string; // Vagy Date
}

// Enemy létrehozásához payload
export interface AdminCreateEnemyPayload {
  name: string;
  health: number;
  skill: number;
  attackDescription?: string | null;
  defeatText?: string | null;
  itemDropId?: number | null;
  xpReward: number;
  specialAttackName?: string | null;
  specialAttackDamageMultiplier?: number | null;
  specialAttackChargeTurns?: number | null;
  specialAttackTelegraphText?: string | null;
  specialAttackExecuteText?: string | null;
}

export interface AdminStoryData {
  id: number;
  title: string;
  description: string | null;
  startingNodeId: number;
  isPublished: boolean;
  createdAt: string; // Vagy Date
  updatedAt: string; // Vagy Date
}

// Story létrehozásához payload
export interface AdminCreateStoryPayload {
  title: string;
  description?: string | null;
  startingNodeId: number;
  isPublished?: boolean;
}

export enum AbilityType {
  PASSIVE_STAT = "PASSIVE_STAT",
  ACTIVE_COMBAT_ACTION = "ACTIVE_COMBAT_ACTION",
  PASSIVE_COMBAT_MODIFIER = "PASSIVE_COMBAT_MODIFIER",
}

// Ability adatok az admin listához és szerkesztéshez
export interface AdminAbilityData {
  id: number;
  name: string;
  description: string;
  type: AbilityType; // Használjuk az enumot
  effectString: string | null;
  talentPointCost: number;
  levelRequirement: number;
  prerequisites: any | null; // JSONB, lehet string[] vagy number[]
  createdAt: string;
  updatedAt: string;
}

// Ability létrehozásához payload
export interface AdminCreateAbilityPayload {
  name: string;
  description: string;
  type: AbilityType;
  effectString?: string | null;
  talentPointCost?: number; // Backend defaultol, de frontendről is küldhetjük
  levelRequirement?: number; // Backend defaultol
  prerequisites?: any | null;
}

// Node frissítéséhez küldendő adatok (minden mező opcionális)
export type AdminUpdateNodePayload = Partial<AdminCreateNodePayload>;
export type AdminUpdateChoicePayload = Partial<AdminCreateChoicePayload>;
export type AdminUpdateItemPayload = Partial<AdminCreateItemPayload>;
export type AdminUpdateEnemyPayload = Partial<AdminCreateEnemyPayload>;
export type AdminUpdateStoryPayload = Partial<AdminCreateStoryPayload>;
export type AdminUpdateAbilityPayload = Partial<AdminCreateAbilityPayload>;
