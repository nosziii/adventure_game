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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var CharacterController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CharacterController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const character_service_1 = require("./character.service");
const class_validator_1 = require("class-validator");
class EquipItemDto {
    itemId;
}
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], EquipItemDto.prototype, "itemId", void 0);
class UnequipItemDto {
    itemType;
}
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsIn)(['weapon', 'armor']),
    __metadata("design:type", String)
], UnequipItemDto.prototype, "itemType", void 0);
let CharacterController = CharacterController_1 = class CharacterController {
    characterService;
    logger = new common_1.Logger(CharacterController_1.name);
    constructor(characterService) {
        this.characterService = characterService;
    }
    async equipItem(req, body) {
        const userId = req.user.id;
        const itemId = body.itemId;
        this.logger.log(`User ${userId} requested to equip item ${itemId}`);
        const updatedCharacterWithEffects = await this.characterService.equipItem(userId, itemId);
        return {
            health: updatedCharacterWithEffects.health,
            skill: updatedCharacterWithEffects.skill,
            luck: updatedCharacterWithEffects.luck,
            stamina: updatedCharacterWithEffects.stamina,
            name: updatedCharacterWithEffects.name,
            level: updatedCharacterWithEffects.level,
            xp: updatedCharacterWithEffects.xp,
            xpToNextLevel: updatedCharacterWithEffects.xp_to_next_level,
            defense: updatedCharacterWithEffects.defense,
        };
    }
    async unequipItem(req, body) {
        const userId = req.user.id;
        const itemType = body.itemType;
        this.logger.log(`User ${userId} requested to unequip item type ${itemType}`);
        const updatedCharacterWithEffects = await this.characterService.unequipItem(userId, itemType);
        return {
            health: updatedCharacterWithEffects.health,
            skill: updatedCharacterWithEffects.skill,
            luck: updatedCharacterWithEffects.luck,
            stamina: updatedCharacterWithEffects.stamina,
            name: updatedCharacterWithEffects.name,
            level: updatedCharacterWithEffects.level,
            xp: updatedCharacterWithEffects.xp,
            xpToNextLevel: updatedCharacterWithEffects.xp_to_next_level,
            defense: updatedCharacterWithEffects.defense,
        };
    }
};
exports.CharacterController = CharacterController;
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Post)('equip'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, EquipItemDto]),
    __metadata("design:returntype", Promise)
], CharacterController.prototype, "equipItem", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Post)('unequip'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, UnequipItemDto]),
    __metadata("design:returntype", Promise)
], CharacterController.prototype, "unequipItem", null);
exports.CharacterController = CharacterController = CharacterController_1 = __decorate([
    (0, common_1.Controller)('character'),
    __metadata("design:paramtypes", [character_service_1.CharacterService])
], CharacterController);
//# sourceMappingURL=character.controller.js.map