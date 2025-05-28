"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlayerAbilitiesModule = void 0;
const common_1 = require("@nestjs/common");
const player_abilities_service_1 = require("./player-abilities.service");
const player_abilities_controller_1 = require("./player-abilities.controller");
const character_module_1 = require("../character.module");
const game_module_1 = require("../game/game.module");
let PlayerAbilitiesModule = class PlayerAbilitiesModule {
};
exports.PlayerAbilitiesModule = PlayerAbilitiesModule;
exports.PlayerAbilitiesModule = PlayerAbilitiesModule = __decorate([
    (0, common_1.Module)({
        imports: [(0, common_1.forwardRef)(() => character_module_1.CharacterModule), (0, common_1.forwardRef)(() => game_module_1.GameModule)],
        controllers: [player_abilities_controller_1.PlayerAbilitiesController],
        providers: [player_abilities_service_1.PlayerAbilitiesService],
    })
], PlayerAbilitiesModule);
//# sourceMappingURL=player-abilities.module.js.map