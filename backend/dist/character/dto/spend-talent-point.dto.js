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
exports.SpendTalentPointDto = void 0;
const class_validator_1 = require("class-validator");
const ALLOWED_STATS_TO_SPEND_ON = [
    'skill',
    'luck',
    'defense',
    'stamina',
];
class SpendTalentPointDto {
    statName;
}
exports.SpendTalentPointDto = SpendTalentPointDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'A statisztika nevének megadása kötelező.' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(ALLOWED_STATS_TO_SPEND_ON, { message: 'Érvénytelen statisztika név.' }),
    __metadata("design:type", String)
], SpendTalentPointDto.prototype, "statName", void 0);
//# sourceMappingURL=spend-talent-point.dto.js.map