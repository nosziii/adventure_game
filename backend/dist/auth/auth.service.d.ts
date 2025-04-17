import { UsersService, User } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
export declare class AuthService {
    private readonly usersService;
    private readonly jwtService;
    private readonly logger;
    constructor(usersService: UsersService, jwtService: JwtService);
    register(registerUserDto: RegisterUserDto): Promise<Omit<User, 'password_hash'>>;
    login(loginUserDto: LoginUserDto): Promise<{
        access_token: string;
    }>;
}
