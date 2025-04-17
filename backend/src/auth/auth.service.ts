import { Injectable, ConflictException, UnauthorizedException, InternalServerErrorException, Logger } from '@nestjs/common'
import { UsersService, User } from '../users/users.service'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcryptjs'
import { RegisterUserDto } from './dto/register-user.dto'
import { LoginUserDto } from './dto/login-user.dto'


@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name)

    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService
    ) {}
    

    async register(registerUserDto: RegisterUserDto): Promise<Omit<User, 'password_hash'>> {
        const { email, password } = registerUserDto
    
        try {
          const existingUser = await this.usersService.findOneByEmail(email)
    
          if (existingUser) {
            this.logger.warn(`Registration failed: Email already exists - ${email}`)
            throw new ConflictException('User with this email already exists')
          }
          const saltRounds = 10
          const hashedPassword = await bcrypt.hash(password, saltRounds)

          const newUser = await this.usersService.create(email, hashedPassword)

          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { password_hash, ...result } = newUser
          return result
    
        } catch (error) {
          if (error instanceof ConflictException) {
            throw error
          }
          this.logger.error(`Unhandled error during registration for ${email}: ${error}`, error.stack)
          throw new InternalServerErrorException('Registration failed due to an internal error.')
        }
      }

    async login(loginUserDto: LoginUserDto): Promise<{ access_token: string }> {
        const { email, password } = loginUserDto
        const user = await this.usersService.findOneByEmail(email)
        if (!user) {
            throw new UnauthorizedException('Invalid credentials')
        }

        const isPasswordValid = await bcrypt.compare(password, user.password_hash)
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials')
        }

        const payload = { email: user.email, sub: user.id }
        const accessToken = this.jwtService.sign(payload)
        return {
            access_token: accessToken
        }
    }
}
