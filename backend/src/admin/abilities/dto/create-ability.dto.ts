// src/admin/abilities/dto/create-ability.dto.ts
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  MaxLength,
  IsEnum,
  IsArray,
} from 'class-validator';

// Definiálhatunk egy enumot a képességtípusokhoz a jobb validációért
export enum AbilityType {
  PASSIVE_STAT = 'PASSIVE_STAT',
  ACTIVE_COMBAT_ACTION = 'ACTIVE_COMBAT_ACTION',
  PASSIVE_COMBAT_MODIFIER = 'PASSIVE_COMBAT_MODIFIER',
  // TODO: További típusok, ha kellenek
}

export class CreateAbilityDto {
  @IsNotEmpty({ message: 'A név megadása kötelező.' })
  @IsString()
  @MaxLength(255)
  name: string;

  @IsNotEmpty({ message: 'A leírás megadása kötelező.' })
  @IsString()
  description: string;

  @IsNotEmpty({ message: 'A típus megadása kötelező.' })
  @IsEnum(AbilityType, { message: 'Érvénytelen képességtípus.' })
  type: AbilityType;

  @IsOptional()
  @IsString()
  effectString?: string | null;

  @IsInt()
  @Min(0)
  talentPointCost: number = 1; // Alapértelmezett érték

  @IsInt()
  @Min(1)
  levelRequirement: number = 1; // Alapértelmezett érték

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  prerequisites?: number[] | null;

  @IsOptional()
  @IsArray({
    message: 'Az engedélyezett archetípus ID-knak egy tömbnek kell lennie.',
  })
  @IsInt({
    each: true,
    message: 'Minden engedélyezett archetípus ID-nak számnak kell lennie.',
  })
  @Min(1, {
    each: true,
    message: 'Minden engedélyezett archetípus ID legalább 1 legyen.',
  })
  allowedArchetypeIds?: number[] | null;
}
