// A Choice szerkezete, amit a backend küld
export interface Choice {
    id: number
    text: string
    isAvailable?: boolean
  }
  
  // Az aktuális Story Node szerkezete
  export interface StoryNodeData {
    id: number
    text: string
    image: string | null
    is_end?: boolean // Ha a backend ezt is küldi
  }

  export interface CharacterStats {
    health: number
    skill: number
    luck: number | null
    stamina: number | null
    name?: string | null
    level: number
    xp: number
    xpToNextLevel: number
}
  
  export interface EnemyData {
    id: number
    name: string
    health: number
    currentHealth: number
    skill?: number
  }

    export interface InventoryItem {
    itemId: number
    quantity: number
    name: string
    description?: string | null
    type: string
    effect?: string | null
    usable?: boolean
}

  // A teljes GameState válasz szerkezete a backendtől (DTO alapján)
  export interface GameStateResponse {
    node: StoryNodeData | null
    choices: Choice[]
    character: CharacterStats
    combat: EnemyData | null  // Használja a fenti EnemyData-t
    messages?: string[]
    inventory?: InventoryItem[] | null
    equippedArmorId?: number | null
    equippedWeaponId?: number | null
  }
