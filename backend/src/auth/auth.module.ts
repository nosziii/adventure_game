import { Module, Logger } from '@nestjs/common'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { UsersModule } from '../users/users.module'
import { JwtModule } from '@nestjs/jwt'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { JwtStrategy } from './jwt.strategy'

@Module({
  imports: [
    UsersModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET')
        const expiresIn = configService.get<string>('JWT_EXPIRATION_TIME')

        // Logoljuk ki az értékeket
        const logger = new Logger('JwtModule_Config');
        logger.log(`JWT Secret loaded: ${secret ? 'OK' : 'MISSING!'}`)
        logger.log(`JWT ExpiresIn value read from env: ->${expiresIn}<-`)

        if (!secret ||!expiresIn) {
          logger.error('JWT_EXPIRATION_TIME is missing or empty in environment variables!')
        }

        return {
          secret: secret,
          signOptions: {
            expiresIn: expiresIn,
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy
  ],
  exports: [AuthService]
})
export class AuthModule {}
