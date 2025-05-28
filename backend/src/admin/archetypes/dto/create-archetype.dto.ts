import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  MaxLength,
  IsArray,
  ArrayMinSize,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer'; // Szükséges a ValidateNested-hez, ha objektumokat validálunk

export class CreateArchetypeDto {
  @IsNotEmpty({ message: 'A név megadása kötelező.' })
  @IsString()
  @MaxLength(255)
  name: string;

  @IsNotEmpty({ message: 'A leírás megadása kötelező.' })
  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  iconPath?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  baseHealthBonus?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  baseSkillBonus?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  baseLuckBonus?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  baseStaminaBonus?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  baseDefenseBonus?: number;

  @IsOptional()
  @IsArray({ message: 'A kezdő képesség ID-knak egy tömbnek kell lennie.' })
  @IsInt({
    each: true,
    message: 'Minden kezdő képesség ID-nak számnak kell lennie.',
  })
  @Min(1, {
    each: true,
    message: 'Minden kezdő képesség ID-nak legalább 1-nek kell lennie.',
  })
  startingAbilityIds?: number[] | null; // A JSONB-t tömbként várjuk

  @IsOptional()
  @IsArray({
    message: 'A megtanulható képesség ID-knak egy tömbnek kell lennie.',
  })
  @IsInt({ each: true })
  @Min(1, { each: true })
  learnableAbilityIds?: number[] | null;
}
