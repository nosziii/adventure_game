"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateNodeDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_node_dto_1 = require("./create-node.dto");
class UpdateNodeDto extends (0, mapped_types_1.PartialType)(create_node_dto_1.CreateNodeDto) {
}
exports.UpdateNodeDto = UpdateNodeDto;
//# sourceMappingURL=update-node.dto.js.map