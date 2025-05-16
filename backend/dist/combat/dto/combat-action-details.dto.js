"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CombatActionDetailsDto = exports.CombatActionRollDetailsDto = void 0;
class CombatActionRollDetailsDto {
    actorSkill;
    diceRoll;
    totalValue;
}
exports.CombatActionRollDetailsDto = CombatActionRollDetailsDto;
class CombatActionDetailsDto {
    actor;
    actionType;
    description;
    attackerRollDetails;
    defenderRollDetails;
    outcome;
    damageDealt;
    healthHealed;
    targetActor;
    targetCurrentHp;
    targetMaxHp;
    itemIdUsed;
    itemNameUsed;
    currentChargeTurns;
    maxChargeTurns;
}
exports.CombatActionDetailsDto = CombatActionDetailsDto;
//# sourceMappingURL=combat-action-details.dto.js.map