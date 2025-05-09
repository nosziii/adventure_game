"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateEnemyDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_enemy_dto_1 = require("./create-enemy.dto");
class UpdateEnemyDto extends (0, mapped_types_1.PartialType)(create_enemy_dto_1.CreateEnemyDto) {
}
exports.UpdateEnemyDto = UpdateEnemyDto;
//# sourceMappingURL=update-enemy.dto.js.map