import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { CharacterService } from '../character.service';
import { UsersService } from '../users/users.service';
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    private readonly configService;
    private readonly characterService;
    private readonly usersService;
    constructor(configService: ConfigService, characterService: CharacterService, usersService: UsersService);
    validate(payload: {
        sub: number;
        email: string;
    }): Promise<{
        id: number;
        email: string;
    }>;
}
export {};
