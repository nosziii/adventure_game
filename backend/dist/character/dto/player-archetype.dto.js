"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlayerArchetypeDto = exports.SimpleAbilityInfoDto = void 0;
class SimpleAbilityInfoDto {
    id;
    name;
    description;
    type;
    effectString;
    talentPointCost;
}
exports.SimpleAbilityInfoDto = SimpleAbilityInfoDto;
class PlayerArchetypeDto {
    id;
    name;
    description;
    iconPath;
    baseHealthBonus;
    baseSkillBonus;
    baseLuckBonus;
    baseStaminaBonus;
    baseDefenseBonus;
    startingAbilities;
}
exports.PlayerArchetypeDto = PlayerArchetypeDto;
//# sourceMappingURL=player-archetype.dto.js.map