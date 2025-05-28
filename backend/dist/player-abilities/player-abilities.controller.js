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
var PlayerAbilitiesController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlayerAbilitiesController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const player_abilities_service_1 = require("./player-abilities.service");
const dto_1 = require("./dto");
const game_service_1 = require("../game/game.service");
let PlayerAbilitiesController = PlayerAbilitiesController_1 = class PlayerAbilitiesController {
    playerAbilitiesService;
    gameService;
    logger = new common_1.Logger(PlayerAbilitiesController_1.name);
    constructor(playerAbilitiesService, gameService) {
        this.playerAbilitiesService = playerAbilitiesService;
        this.gameService = gameService;
    }
    async listLearnableAbilities(req) {
        const userId = req.user.id;
        this.logger.log(`User ${userId} requesting their learnable abilities.`);
        return this.playerAbilitiesService.getLearnableAbilities(userId);
    }
    async learnNewAbility(req, learnAbilityDto) {
        const userId = req.user.id;
        this.logger.log(`User ${userId} attempting to learn ability ID: ${learnAbilityDto.abilityId}`);
        await this.playerAbilitiesService.learnAbility(userId, learnAbilityDto.abilityId);
        this.logger.log(`Ability learned. Fetching updated game state for user ${userId}.`);
        return this.gameService.getCurrentGameState(userId);
    }
};
exports.PlayerAbilitiesController = PlayerAbilitiesController;
__decorate([
    (0, common_1.Get)('learnable'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PlayerAbilitiesController.prototype, "listLearnableAbilities", null);
__decorate([
    (0, common_1.Post)('learn'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.LearnAbilityRequestDto]),
    __metadata("design:returntype", Promise)
], PlayerAbilitiesController.prototype, "learnNewAbility", null);
exports.PlayerAbilitiesController = PlayerAbilitiesController = PlayerAbilitiesController_1 = __decorate([
    (0, common_1.Controller)('player-abilities'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __metadata("design:paramtypes", [player_abilities_service_1.PlayerAbilitiesService,
        game_service_1.GameService])
], PlayerAbilitiesController);
//# sourceMappingURL=player-abilities.controller.js.map