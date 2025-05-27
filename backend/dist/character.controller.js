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
const game_service_1 = require("./game/game.service");
const dto_1 = require("./character/dto");
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
    gameService;
    logger = new common_1.Logger(CharacterController_1.name);
    constructor(characterService, gameService) {
        this.characterService = characterService;
        this.gameService = gameService;
    }
    async equipItem(req, body) {
        const userId = req.user.id;
        const itemId = body.itemId;
        this.logger.log(`User ${userId} requested to equip item ${itemId}`);
        const baseCharacter = await this.characterService.findOrCreateByUserId(userId);
        const updatedProgress = await this.characterService.equipItem(baseCharacter.id, itemId);
        let characterWithEffects = {
            ...baseCharacter,
            health: updatedProgress.health,
            skill: updatedProgress.skill,
            luck: updatedProgress.luck,
            stamina: updatedProgress.stamina,
            defense: updatedProgress.defense,
            level: updatedProgress.level,
            xp: updatedProgress.xp,
            xp_to_next_level: updatedProgress.xp_to_next_level,
            current_node_id: updatedProgress.current_node_id,
            equipped_weapon_id: updatedProgress.equipped_weapon_id,
            equipped_armor_id: updatedProgress.equipped_armor_id,
        };
        characterWithEffects =
            await this.characterService.applyPassiveEffects(characterWithEffects);
        return {
            health: characterWithEffects.health,
            skill: characterWithEffects.skill,
            luck: characterWithEffects.luck,
            stamina: characterWithEffects.stamina,
            name: baseCharacter.name,
            level: characterWithEffects.level,
            xp: characterWithEffects.xp,
            xpToNextLevel: characterWithEffects.xp_to_next_level,
            defense: characterWithEffects.defense,
        };
    }
    async unequip(req, body) {
        const userId = req.user.id;
        const itemType = body.itemType;
        this.logger.log(`User ${userId} requested to unequip item type ${itemType}`);
        const baseCharacter = await this.characterService.findOrCreateByUserId(userId);
        const updatedProgress = await this.characterService.unequipItem(baseCharacter.id, itemType);
        let characterWithEffects = {
            ...baseCharacter,
            health: updatedProgress.health,
            skill: updatedProgress.skill,
            luck: updatedProgress.luck,
            stamina: updatedProgress.stamina,
            defense: updatedProgress.defense,
            level: updatedProgress.level,
            xp: updatedProgress.xp,
            xp_to_next_level: updatedProgress.xp_to_next_level,
            current_node_id: updatedProgress.current_node_id,
            equipped_weapon_id: updatedProgress.equipped_weapon_id,
            equipped_armor_id: updatedProgress.equipped_armor_id,
        };
        characterWithEffects =
            await this.characterService.applyPassiveEffects(characterWithEffects);
        return {
            health: characterWithEffects.health,
            skill: characterWithEffects.skill,
            luck: characterWithEffects.luck,
            stamina: characterWithEffects.stamina,
            name: baseCharacter.name,
            level: characterWithEffects.level,
            xp: characterWithEffects.xp,
            xpToNextLevel: characterWithEffects.xp_to_next_level,
            defense: characterWithEffects.defense,
        };
    }
    async beginNewPlaythrough(req, storyId, body) {
        const userId = req.user.id;
        const character = await this.characterService.findOrCreateByUserId(userId);
        if (!character) {
            throw new common_1.NotFoundException('Character not found for user.');
        }
        this.logger.log(`User ${userId} (Character ${character.id}) beginning new playthrough of story ${storyId} with archetype ${body.archetypeId}`);
        await this.characterService.beginNewStoryPlaythrough(character.id, storyId, body.archetypeId);
        this.logger.log(`New playthrough started. Fetching initial game state for user ${userId}.`);
        return this.gameService.getCurrentGameState(userId);
    }
    async resetStory(req, storyId) {
        const userId = req.user.id;
        const character = await this.characterService.findOrCreateByUserId(userId);
        if (!character) {
            throw new common_1.NotFoundException('Character not found for this user.');
        }
        this.logger.log(`User ${userId} (Character ${character.id}) requested to reset story ${storyId}`);
        await this.characterService.resetStoryProgress(character.id, storyId);
    }
    async spendTalentPoint(req, spendTalentPointDto) {
        const userId = req.user.id;
        const baseCharacter = await this.characterService.findOrCreateByUserId(userId);
        if (!baseCharacter) {
            throw new common_1.NotFoundException('Character not found for user.');
        }
        this.logger.log(`User ${userId} (Character ${baseCharacter.id}) spending talent point on: ${spendTalentPointDto.statName}`);
        await this.characterService.spendTalentPointOnStat(baseCharacter.id, spendTalentPointDto.statName);
        this.logger.log(`Talent point spent for char ${baseCharacter.id}. Fetching updated game state.`);
        const newGameState = await this.gameService.getCurrentGameState(userId);
        return newGameState;
    }
    async listSelectableArchetypes() {
        this.logger.log('Request received for selectable archetypes');
        return this.characterService.getSelectableArchetypes();
    }
    async selectArchetype(req, selectArchetypeDto) {
        const userId = req.user.id;
        const character = await this.characterService.findOrCreateByUserId(userId);
        this.logger.log(`User ${userId} (Character ${character.id}) selected archetype ID: ${selectArchetypeDto.archetypeId}`);
        const updatedBaseCharacter = await this.characterService.selectArchetypeForCharacter(character.id, selectArchetypeDto.archetypeId);
        return {
            id: userId,
            email: req.user.email,
            role: req.user.role,
            selected_archetype_id: updatedBaseCharacter.selected_archetype_id,
        };
    }
};
exports.CharacterController = CharacterController;
__decorate([
    (0, common_1.Post)('equip'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, EquipItemDto]),
    __metadata("design:returntype", Promise)
], CharacterController.prototype, "equipItem", null);
__decorate([
    (0, common_1.Post)('unequip'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, UnequipItemDto]),
    __metadata("design:returntype", Promise)
], CharacterController.prototype, "unequip", null);
__decorate([
    (0, common_1.Post)('story/:storyId/begin'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('storyId', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, dto_1.BeginStoryWithArchetypeDto]),
    __metadata("design:returntype", Promise)
], CharacterController.prototype, "beginNewPlaythrough", null);
__decorate([
    (0, common_1.Post)('story/:storyId/reset'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('storyId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", Promise)
], CharacterController.prototype, "resetStory", null);
__decorate([
    (0, common_1.Post)('spend-talent-point'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.SpendTalentPointDto]),
    __metadata("design:returntype", Promise)
], CharacterController.prototype, "spendTalentPoint", null);
__decorate([
    (0, common_1.Get)('archetypes'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CharacterController.prototype, "listSelectableArchetypes", null);
__decorate([
    (0, common_1.Post)('select-archetype'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.SelectArchetypeDto]),
    __metadata("design:returntype", Promise)
], CharacterController.prototype, "selectArchetype", null);
exports.CharacterController = CharacterController = CharacterController_1 = __decorate([
    (0, common_1.Controller)('character'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __metadata("design:paramtypes", [character_service_1.CharacterService,
        game_service_1.GameService])
], CharacterController);
//# sourceMappingURL=character.controller.js.map