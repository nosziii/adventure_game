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
exports.CreateEnemyDto = void 0;
const class_validator_1 = require("class-validator");
class CreateEnemyDto {
    name;
    health;
    skill;
    attackDescription;
    defeatText;
    itemDropId;
    xpReward;
    specialAttackName;
    specialAttackDamageMultiplier;
    specialAttackChargeTurns;
    specialAttackTelegraphText;
    specialAttackExecuteText;
}
exports.CreateEnemyDto = CreateEnemyDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'A név megadása kötelező.' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], CreateEnemyDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Az életerő megadása kötelező.' }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateEnemyDto.prototype, "health", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Az ügyesség megadása kötelező.' }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateEnemyDto.prototype, "skill", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", Object)
], CreateEnemyDto.prototype, "attackDescription", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", Object)
], CreateEnemyDto.prototype, "defeatText", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Object)
], CreateEnemyDto.prototype, "itemDropId", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Az XP jutalom megadása kötelező.' }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateEnemyDto.prototype, "xpReward", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", Object)
], CreateEnemyDto.prototype, "specialAttackName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsPositive)(),
    __metadata("design:type", Object)
], CreateEnemyDto.prototype, "specialAttackDamageMultiplier", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Object)
], CreateEnemyDto.prototype, "specialAttackChargeTurns", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", Object)
], CreateEnemyDto.prototype, "specialAttackTelegraphText", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", Object)
], CreateEnemyDto.prototype, "specialAttackExecuteText", void 0);
//# sourceMappingURL=create-enemy.dto.js.map