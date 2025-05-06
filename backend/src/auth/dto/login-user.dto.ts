import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator'

export class LoginUserDto {
  @IsNotEmpty({ message: 'Az email cím megadása kötelező.' }) // Nem lehet üres
  @IsEmail({}, { message: 'Érvénytelen email formátum.' }) // Email formátumot validál
  email: string;

  @IsNotEmpty({ message: 'A jelszó megadása kötelező.' })
  @IsString() // Stringnek kell lennie
  // @MinLength(6, { message: 'A jelszónak legalább 6 karakternek kell lennie.' }) // Opcionális: min hossz
  password: string;
}