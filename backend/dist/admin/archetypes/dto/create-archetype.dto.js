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
exports.CreateArchetypeDto = void 0;
const class_validator_1 = require("class-validator");
class CreateArchetypeDto {
    name;
    description;
    iconPath;
    baseHealthBonus;
    baseSkillBonus;
    baseLuckBonus;
    baseStaminaBonus;
    baseDefenseBonus;
    startingAbilityIds;
    learnableAbilityIds;
}
exports.CreateArchetypeDto = CreateArchetypeDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'A név megadása kötelező.' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], CreateArchetypeDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'A leírás megadása kötelező.' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateArchetypeDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", Object)
], CreateArchetypeDto.prototype, "iconPath", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateArchetypeDto.prototype, "baseHealthBonus", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateArchetypeDto.prototype, "baseSkillBonus", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateArchetypeDto.prototype, "baseLuckBonus", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateArchetypeDto.prototype, "baseStaminaBonus", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateArchetypeDto.prototype, "baseDefenseBonus", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)({ message: 'A kezdő képesség ID-knak egy tömbnek kell lennie.' }),
    (0, class_validator_1.IsInt)({
        each: true,
        message: 'Minden kezdő képesség ID-nak számnak kell lennie.',
    }),
    (0, class_validator_1.Min)(1, {
        each: true,
        message: 'Minden kezdő képesség ID-nak legalább 1-nek kell lennie.',
    }),
    __metadata("design:type", Object)
], CreateArchetypeDto.prototype, "startingAbilityIds", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)({
        message: 'A megtanulható képesség ID-knak egy tömbnek kell lennie.',
    }),
    (0, class_validator_1.IsInt)({ each: true }),
    (0, class_validator_1.Min)(1, { each: true }),
    __metadata("design:type", Object)
], CreateArchetypeDto.prototype, "learnableAbilityIds", void 0);
//# sourceMappingURL=create-archetype.dto.js.map