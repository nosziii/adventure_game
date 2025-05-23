// A Choice szerkezete, amit a backend küld
export interface Choice {
  id: number;
  text: string;
  isAvailable?: boolean;
}

// Az aktuális Story Node szerkezete
export interface StoryNodeData {
  id: number;
  text: string;
  image: string | null;
  is_end?: boolean; // Ha a backend ezt is küldi
}

export interface CharacterStats {
  health: number;
  skill: number;
  luck: number | null;
  stamina: number | null;
  name?: string | null;
  level: number;
  xp: number;
  xpToNextLevel: number;
  defense: number | null;
  talentPointsAvailable?: number | null;
}

export interface EnemyData {
  id: number;
  name: string;
  health: number;
  currentHealth: number;
  skill?: number;
  isChargingSpecial?: boolean;
  currentChargeTurns?: number | null;
  maxChargeTurns?: number | null;
  specialAttackTelegraphText?: string | null;
}

export interface InventoryItem {
  itemId: number;
  quantity: number;
  name: string;
  description?: string | null;
  type: string;
  effect?: string | null;
  usable?: boolean;
}

export interface PlayerProgressStep {
  nodeId: number;
  choiceIdTaken: number | null;
  visitedAt: string; // A JSON stringként küldi a Date-t
}
export interface PlayerMapNode {
  // Korábban PlayerMapNodeDto volt a backend DTO neve
  id: number;
  textSnippet: string;
}

export interface PlayerMapEdge {
  // Korábban PlayerMapEdgeDto volt
  from: number | null;
  to: number;
  choiceTextSnippet?: string | null;
}

export interface PlayerMapData {
  nodes: PlayerMapNode[];
  edges: PlayerMapEdge[];
}
export interface CombatActionRollDetails {
  actorSkill: number;
  diceRoll: number;
  totalValue: number;
}
export interface CombatActionDetails {
  actor: "player" | "enemy";
  actionType:
    | "attack"
    | "defend"
    | "use_item"
    | "special_attack_charge"
    | "special_attack_execute"
    | "info"
    | "victory"
    | "defeat";
  description: string;
  attackerRollDetails?: CombatActionRollDetails;
  defenderRollDetails?: CombatActionRollDetails;
  outcome: "hit" | "miss" | /*...*/ "info" | "victory" | "defeat"; // Bővített outcome-ok
  damageDealt?: number;
  healthHealed?: number;
  targetActor?: "player" | "enemy";
  targetCurrentHp?: number;
  targetMaxHp?: number;
  itemIdUsed?: number;
  itemNameUsed?: string;
  currentChargeTurns?: number;
  maxChargeTurns?: number;
}

// A teljes GameState válasz szerkezete a backendtől (DTO alapján)
export interface GameStateResponse {
  node: StoryNodeData | null;
  choices: Choice[];
  character: CharacterStats;
  combat: EnemyData | null; // Használja a fenti EnemyData-t
  messages?: string[];
  inventory?: InventoryItem[] | null;
  equippedArmorId?: number | null;
  equippedWeaponId?: number | null;
  roundActions?: CombatActionDetails[] | null;
}

export interface StoryInfo {
  id: number;
  title: string;
  description: string | null;
}
export interface PlayerStoryListItem extends StoryInfo {
  lastPlayedAt: string | null; // A Date stringgé konvertálódik JSON-ben
  currentNodeIdInStory: number | null;
  isActive: boolean;
}
