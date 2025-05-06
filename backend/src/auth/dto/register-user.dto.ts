import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterUserDto {
  @IsNotEmpty({ message: 'Az email cím megadása kötelező.' })
  @IsEmail({}, { message: 'Érvénytelen email formátum.' })
  email: string;

  @IsNotEmpty({ message: 'A jelszó megadása kötelező.' })
  @IsString()
  @MinLength(6, { message: 'A jelszónak legalább 6 karakter hosszúnak kell lennie.' }) // Regisztrációnál legyen erősebb ellenőrzés
  password: string;

  // Ide jöhetne pl. passwordConfirm mező is validációval
}