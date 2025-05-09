"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateChoiceDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_choice_dto_1 = require("./create-choice.dto");
class UpdateChoiceDto extends (0, mapped_types_1.PartialType)(create_choice_dto_1.CreateChoiceDto) {
}
exports.UpdateChoiceDto = UpdateChoiceDto;
//# sourceMappingURL=update-choice.dto.js.map