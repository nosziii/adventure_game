"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CombatActionDto = void 0;
const class_validator_1 = require("class-validator");
const allowedActions = ['attack', 'use_item', 'defend'];
class CombatActionDto {
    action;
    itemId;
}
exports.CombatActionDto = CombatActionDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(allowedActions),
    __metadata("design:type", String)
], CombatActionDto.prototype, "action", void 0);
__decorate([
    (0, class_validator_1.ValidateIf)((o) => o.action === 'use_item'),
    (0, class_validator_1.IsNotEmpty)({ message: 'itemId is required when action is use_item' }),
    (0, class_validator_1.IsInt)({ message: 'itemId must be an integer' }),
    __metadata("design:type", Number)
], CombatActionDto.prototype, "itemId", void 0);
//# sourceMappingURL=combat-action.dto.js.map