
// todo késöbb kiszervezni ide 
// export interface Character {
//     id: number
//     user_id: number
//     name: string | null;
//     health: number
//     skill: number
//     luck: number | null
//     stamina: number | null
//     current_node_id: number | null
//     created_at: Date
//     updated_at: Date
// }

export interface InventoryItem {
     itemId: number
    quantity: number
    name?: string
    description?: string
    type?: string
    effect?: string | null
    usable?: boolean
}