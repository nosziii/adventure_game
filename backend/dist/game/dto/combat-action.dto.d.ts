declare const allowedActions: readonly ["attack", "use_item"];
type CombatActionType = typeof allowedActions[number];
export declare class CombatActionDto {
    action: CombatActionType;
    itemId?: number;
}
export {};
