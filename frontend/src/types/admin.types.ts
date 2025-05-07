// A Story Node megjelenítéséhez és listázásához szükséges adatok
export interface AdminNodeData {
  id: number
  text: string
  image: string | null
  is_end: boolean
  health_effect: number | null
  item_reward_id: number | null
  enemy_id: number | null
  created_at: string // A backend Date-t küld, de az Axios/JSON stringgé alakíthatja
  updated_at: string // Fontos lehet a Date objektummá alakítás a frontend oldalon, ha szükséges
}

// Node létrehozásához küldendő adatok
export interface AdminCreateNodePayload {
  text: string
  image?: string | null
  is_end?: boolean
  health_effect?: number | null
  item_reward_id?: number | null
  enemy_id?: number | null
}

// Node frissítéséhez küldendő adatok (minden mező opcionális)
export type AdminUpdateNodePayload = Partial<AdminCreateNodePayload>