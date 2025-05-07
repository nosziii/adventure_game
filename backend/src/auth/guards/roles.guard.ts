// src/auth/guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { RequestUser } from '../jwt.strategy';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true; // Ha nincs @Roles dekorátor, átengedjük
    }

      
    const request = context.switchToHttp().getRequest();
    const user = request.user as RequestUser; // Feltételezzük, hogy a JwtStrategy már lefutott
      
    if (!user || !user.role) {
      return false;
    }

    // Ellenőrizzük, hogy a user role-ja szerepel-e a szükséges role-ok között
    const hasRequiredRole = requiredRoles.some((role) => user.role === role);
    return hasRequiredRole; 
  }
}