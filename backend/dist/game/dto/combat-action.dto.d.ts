declare const allowedActions: readonly ["attack", "use_item", "defend", "use_ability"];
export type CombatActionType = (typeof allowedActions)[number];
export declare class CombatActionDto {
    action: CombatActionType;
    itemId?: number;
    abilityId?: number;
}
export {};
