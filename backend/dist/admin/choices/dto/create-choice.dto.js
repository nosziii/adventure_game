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
exports.CreateChoiceDto = void 0;
const class_validator_1 = require("class-validator");
class CreateChoiceDto {
    sourceNodeId;
    targetNodeId;
    text;
    requiredItemId;
    itemCostId;
    requiredStatCheck;
}
exports.CreateChoiceDto = CreateChoiceDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'A forrás csomópont ID megadása kötelező.' }),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CreateChoiceDto.prototype, "sourceNodeId", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'A cél csomópont ID megadása kötelező.' }),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CreateChoiceDto.prototype, "targetNodeId", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'A választás szövegének megadása kötelező.' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], CreateChoiceDto.prototype, "text", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Object)
], CreateChoiceDto.prototype, "requiredItemId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Object)
], CreateChoiceDto.prototype, "itemCostId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", Object)
], CreateChoiceDto.prototype, "requiredStatCheck", void 0);
//# sourceMappingURL=create-choice.dto.js.map