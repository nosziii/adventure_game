import { Controller, Get, Request, UseGuards, Logger } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'

@Controller('users')
export class UsersController {

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  getProfile(@Request() req) {
    Logger.log(`User profile requested for user ID: ${req.user?.id}`)
    return req.user
  }
  private readonly logger = new Logger(UsersController.name)
}