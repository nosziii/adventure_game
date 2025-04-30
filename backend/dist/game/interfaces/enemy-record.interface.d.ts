export interface EnemyRecord {
    id: number;
    name: string;
    health: number;
    skill: number;
    attack_description: string | null;
    defeat_text: string | null;
    item_drop_id: number | null;
    created_at: Date;
    updated_at: Date;
}
