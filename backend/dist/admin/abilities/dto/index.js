"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbilityType = void 0;
__exportStar(require("./ability-admin.dto"), exports);
__exportStar(require("./create-ability.dto"), exports);
__exportStar(require("./update-ability.dto"), exports);
var create_ability_dto_1 = require("./create-ability.dto");
Object.defineProperty(exports, "AbilityType", { enumerable: true, get: function () { return create_ability_dto_1.AbilityType; } });
//# sourceMappingURL=index.js.map