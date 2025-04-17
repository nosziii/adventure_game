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
var GameController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const game_service_1 = require("./game.service");
const make_choice_dto_1 = require("./dto/make-choice.dto");
let GameController = GameController_1 = class GameController {
    gameService;
    logger = new common_1.Logger(GameController_1.name);
    constructor(gameService) {
        this.gameService = gameService;
    }
    async getGameState(req) {
        if (!req.user || !req.user.id) {
            this.logger.error('User not found on request after global guard!');
        }
        const userId = req.user?.id;
        if (!userId) {
            this.logger.error('Cannot proceed without userId!');
            throw new Error('UserID not found after guard.');
        }
        return this.gameService.getCurrentGameState(userId);
    }
    async makeChoice(req, makeChoiceDto) {
        const userId = req.user.id;
        const choiceId = makeChoiceDto.choiceId;
        this.logger.log(`Received request to make choice ID: ${choiceId} from user ID: ${userId}`);
        return this.gameService.makeChoice(userId, choiceId);
    }
};
exports.GameController = GameController;
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Get)('state'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GameController.prototype, "getGameState", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Post)('choice'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, make_choice_dto_1.MakeChoiceDto]),
    __metadata("design:returntype", Promise)
], GameController.prototype, "makeChoice", null);
exports.GameController = GameController = GameController_1 = __decorate([
    (0, common_1.Controller)('game'),
    __metadata("design:paramtypes", [game_service_1.GameService])
], GameController);
//# sourceMappingURL=game.controller.js.map