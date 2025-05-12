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
}

export interface EnemyData {
  id: number;
  name: string;
  health: number;
  currentHealth: number;
  skill?: number;
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
}
