"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateAbilityDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_ability_dto_1 = require("./create-ability.dto");
class UpdateAbilityDto extends (0, mapped_types_1.PartialType)(create_ability_dto_1.CreateAbilityDto) {
}
exports.UpdateAbilityDto = UpdateAbilityDto;
//# sourceMappingURL=update-ability.dto.js.map