import { Injectable, UnauthorizedException, InternalServerErrorException, Logger } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { Strategy, ExtractJwt } from 'passport-jwt'
import { ConfigService } from '@nestjs/config'
import { CharacterService, Character } from '../character.service'
import { UsersService } from '../users/users.service'

// Payload a tokenben
interface UserPayload { sub: number; email: string; }

// Struktúra, amit a req.user-be teszünk
export interface RequestUser {
    id: number
    email: string
    role: string
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name)

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

  async validate(payload: UserPayload): Promise<RequestUser> {
        this.logger.debug(`Validating JWT payload for user ID: ${payload.sub}`)
        const user = await this.usersService.findOneById(payload.sub)
    if (!user) {
             this.logger.warn(`User ${payload.sub} not found or missing role during JWT validation.`)
             throw new UnauthorizedException('User associated with token not found.')
        }
        // Csak az alap adatokat adjuk vissza, amit a payload tartalmazott (és validáltunk)
        return { id: user.id, email: user.email, role: user.role }
     }
}