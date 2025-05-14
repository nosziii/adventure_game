declare const allowedActions: readonly ["attack", "use_item", "defend"];
type CombatActionType = (typeof allowedActions)[number];
export declare class CombatActionDto {
    action: CombatActionType;
    itemId?: number;
}
export {};
