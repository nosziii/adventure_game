import { Injectable, UnauthorizedException, InternalServerErrorException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { Strategy, ExtractJwt } from 'passport-jwt'
import { ConfigService } from '@nestjs/config'
import { CharacterService, Character } from '../character.service'
import { UsersService } from '../users/users.service'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private readonly configService: ConfigService,
        private readonly characterService: CharacterService,
        private readonly usersService: UsersService
      ) {
        const secret = configService.get<string>('JWT_SECRET')
    
        if (!secret) {
          throw new InternalServerErrorException('JWT_SECRET environment variable is not set!')
        }
        super({
          jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
          ignoreExpiration: false,
          secretOrKey: secret,
        })
      }

      async validate(payload: { sub: number; email: string }): Promise<{ id: number; email: string }> {
        const userId = payload.sub;
        const user = await this.usersService.findOneById(payload.sub); // UsersService findOneById kell!
        if (!user) {
             throw new UnauthorizedException('User associated with token not found.');
        }
        // Csak az alap adatokat adjuk vissza, amit a payload tartalmazott (és validáltunk)
        return { id: payload.sub, email: payload.email }
     }
}