import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  MaxLength,
  IsNumber,
  IsPositive,
} from 'class-validator';

export class CreateEnemyDto {
  @IsNotEmpty({ message: 'A név megadása kötelező.' })
  @IsString()
  @MaxLength(100)
  name: string;

  @IsNotEmpty({ message: 'Az életerő megadása kötelező.' })
  @IsInt()
  @Min(1)
  health: number;

  @IsNotEmpty({ message: 'Az ügyesség megadása kötelező.' })
  @IsInt()
  @Min(0)
  skill: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  attackDescription?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  defeatText?: string | null;

  @IsOptional()
  @IsInt()
  @Min(1) // Item ID-ra hivatkozik
  itemDropId?: number | null;

  @IsNotEmpty({ message: 'Az XP jutalom megadása kötelező.' })
  @IsInt()
  @Min(0)
  xpReward: number;
  @IsOptional()
  @IsString()
  @MaxLength(100)
  specialAttackName?: string | null;

  @IsOptional()
  @IsNumber()
  @IsPositive() // Legyen pozitív a szorzó
  specialAttackDamageMultiplier?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0) // 0 töltési kör is érvényes lehet (azonnali speciális)
  specialAttackChargeTurns?: number | null;

  @IsOptional()
  @IsString()
  specialAttackTelegraphText?: string | null;

  @IsOptional()
  @IsString()
  specialAttackExecuteText?: string | null;
}
