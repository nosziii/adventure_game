export interface InventoryItem {
    itemId: number;
    quantity: number;
    name?: string;
    description?: string;
    type?: string;
    effect?: string | null;
    usable?: boolean;
}
