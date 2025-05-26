"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateArchetypeDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_archetype_dto_1 = require("./create-archetype.dto");
class UpdateArchetypeDto extends (0, mapped_types_1.PartialType)(create_archetype_dto_1.CreateArchetypeDto) {
}
exports.UpdateArchetypeDto = UpdateArchetypeDto;
//# sourceMappingURL=update-archetype.dto.js.map