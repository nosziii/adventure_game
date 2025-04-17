// A Choice szerkezete, amit a backend küld
export interface Choice {
    id: number
    text: string
  }
  
  // Az aktuális Story Node szerkezete
  export interface StoryNodeData {
    id: number
    text: string
    image: string | null
    // is_end?: boolean; // Ha a backend ezt is küldi
  }

  export interface CharacterStats {
    health: number
    skill: number
    // name?: string | null;
}
  
  // A teljes GameState válasz szerkezete a backendtől
  export interface GameStateResponse {
    node: StoryNodeData
    choices: Choice[]
    character: CharacterStats
  }
  