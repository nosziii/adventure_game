import { Controller, Get, UseGuards, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { RequestUser } from '../auth/jwt.strategy';
import { Request as ExpressRequest } from 'express';
import { Request as Req } from '@nestjs/common';

interface RequestWithUser extends ExpressRequest {
  user: RequestUser;
}

@Controller('users')
export class UsersController {
  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  getProfile(@Req() req: RequestWithUser) {
    Logger.log(`User profile requested for user ID: ${req.user?.id}`);
    return req.user;
  }
  private readonly logger = new Logger(UsersController.name);
}
