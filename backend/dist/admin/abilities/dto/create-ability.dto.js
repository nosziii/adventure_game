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
exports.CreateAbilityDto = exports.AbilityType = void 0;
const class_validator_1 = require("class-validator");
var AbilityType;
(function (AbilityType) {
    AbilityType["PASSIVE_STAT"] = "PASSIVE_STAT";
    AbilityType["ACTIVE_COMBAT_ACTION"] = "ACTIVE_COMBAT_ACTION";
    AbilityType["PASSIVE_COMBAT_MODIFIER"] = "PASSIVE_COMBAT_MODIFIER";
})(AbilityType || (exports.AbilityType = AbilityType = {}));
class CreateAbilityDto {
    name;
    description;
    type;
    effectString;
    talentPointCost = 1;
    levelRequirement = 1;
    prerequisites;
    allowedArchetypeIds;
}
exports.CreateAbilityDto = CreateAbilityDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'A név megadása kötelező.' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], CreateAbilityDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'A leírás megadása kötelező.' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAbilityDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'A típus megadása kötelező.' }),
    (0, class_validator_1.IsEnum)(AbilityType, { message: 'Érvénytelen képességtípus.' }),
    __metadata("design:type", String)
], CreateAbilityDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", Object)
], CreateAbilityDto.prototype, "effectString", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateAbilityDto.prototype, "talentPointCost", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateAbilityDto.prototype, "levelRequirement", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateAbilityDto.prototype, "prerequisites", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)({
        message: 'Az engedélyezett archetípus ID-knak egy tömbnek kell lennie.',
    }),
    (0, class_validator_1.IsInt)({
        each: true,
        message: 'Minden engedélyezett archetípus ID-nak számnak kell lennie.',
    }),
    (0, class_validator_1.Min)(1, {
        each: true,
        message: 'Minden engedélyezett archetípus ID legalább 1 legyen.',
    }),
    __metadata("design:type", Object)
], CreateAbilityDto.prototype, "allowedArchetypeIds", void 0);
//# sourceMappingURL=create-ability.dto.js.map