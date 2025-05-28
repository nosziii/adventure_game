import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { CharacterService } from '../character.service';
import { UsersService } from '../users/users.service';
interface UserPayload {
    sub: number;
    email: string;
}
export interface RequestUser {
    id: number;
    email: string;
    role: string;
}
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithoutRequest] | [opt: import("passport-jwt").StrategyOptionsWithRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    private readonly configService;
    private readonly characterService;
    private readonly usersService;
    private readonly logger;
    constructor(configService: ConfigService, characterService: CharacterService, usersService: UsersService);
    validate(payload: UserPayload): Promise<RequestUser>;
}
export {};
