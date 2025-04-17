"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseModule = exports.KNEX_CONNECTION = void 0;
const common_1 = require("@nestjs/common");
const knex_1 = require("knex");
const objection_1 = require("objection");
exports.KNEX_CONNECTION = 'KNEX_CONNECTION';
const kenxProvider = {
    provide: exports.KNEX_CONNECTION,
    useFactory: async () => {
        const dbUrl = process.env.DATABASE_URL;
        if (!dbUrl) {
            throw new Error('DATABASE_URL environment variable is not set.');
        }
        const knexConfig = {
            client: 'pg',
            connection: dbUrl,
            pool: { min: 2, max: 10 },
            ...objection_1.default,
        };
        return (0, knex_1.default)(knexConfig);
    },
};
let DatabaseModule = class DatabaseModule {
};
exports.DatabaseModule = DatabaseModule;
exports.DatabaseModule = DatabaseModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        providers: [kenxProvider],
        exports: [kenxProvider]
    })
], DatabaseModule);
//# sourceMappingURL=database.module.js.map