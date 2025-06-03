import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
  Max,
  IsUrl,
} from 'class-validator';

export class CreateNodeDto {
  @IsNotEmpty({ message: 'A szöveg megadása kötelező.' })
  @IsString()
  text: string;

  @IsOptional() // Opcionális
  @IsString()
  @IsUrl({}, { message: 'Érvénytelen URL formátum.' }) // Egyszerű URL validáció
  image?: string | null;

  @IsOptional()
  @IsBoolean()
  is_end?: boolean; // Alapértelmezett false lesz a DB-ben

  @IsOptional()
  @IsInt()
  health_effect?: number | null;

  @IsOptional()
  @IsInt()
  @Min(1) // Feltételezzük, hogy az item ID pozitív
  item_reward_id?: number | null;

  @IsOptional()
  @IsInt()
  @Min(1) // Feltételezzük, hogy az enemy ID pozitív
  enemy_id?: number | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  victoryNodeId?: number | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  defeatNodeId?: number | null;
}
