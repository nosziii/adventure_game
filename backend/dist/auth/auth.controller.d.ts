import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(registerUserDto: RegisterUserDto): Promise<Omit<import("../users/users.service").User, "password_hash">>;
    login(loginUserDto: LoginUserDto): Promise<{
        access_token: string;
    }>;
}
