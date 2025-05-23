declare const ALLOWED_STATS_TO_SPEND_ON: readonly ["skill", "luck", "defense", "stamina"];
export type SpendableStatName = (typeof ALLOWED_STATS_TO_SPEND_ON)[number];
export declare class SpendTalentPointDto {
    statName: SpendableStatName;
}
export {};
