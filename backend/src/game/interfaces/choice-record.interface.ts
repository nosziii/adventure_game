export interface ChoiceRecord {
    id: number
    source_node_id: number
    target_node_id: number
    text: string
    required_item_id: number | null
    item_cost_id: number | null
    required_stat_check: string | null
    visible_only_if: string | null
    created_at: Date
    updated_at: Date

}