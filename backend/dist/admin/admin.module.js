"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminModule = void 0;
const common_1 = require("@nestjs/common");
const nodes_controller_1 = require("./nodes/nodes.controller");
const nodes_service_1 = require("./nodes/nodes.service");
const choices_controller_1 = require("./choices/choices.controller");
const choices_service_1 = require("./choices/choices.service");
const items_controller_1 = require("./items/items.controller");
const items_service_1 = require("./items/items.service");
const enemies_controller_1 = require("./enemies/enemies.controller");
const enemies_service_1 = require("./enemies/enemies.service");
const stories_controller_1 = require("./stories/stories.controller");
const stories_service_1 = require("./stories/stories.service");
let AdminModule = class AdminModule {
};
exports.AdminModule = AdminModule;
exports.AdminModule = AdminModule = __decorate([
    (0, common_1.Module)({
        controllers: [
            nodes_controller_1.AdminNodesController,
            choices_controller_1.AdminChoicesController,
            items_controller_1.AdminItemsController,
            enemies_controller_1.AdminEnemiesController,
            stories_controller_1.AdminStoriesController,
        ],
        providers: [
            nodes_service_1.AdminNodesService,
            choices_service_1.AdminChoicesService,
            items_service_1.AdminItemsService,
            enemies_service_1.AdminEnemiesService,
            stories_service_1.AdminStoriesService,
        ],
    })
], AdminModule);
//# sourceMappingURL=admin.module.js.map