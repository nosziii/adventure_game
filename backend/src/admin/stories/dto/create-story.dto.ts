import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  MaxLength,
  IsBoolean,
} from 'class-validator';

export class CreateStoryDto {
  @IsNotEmpty({ message: 'A cím megadása kötelező.' })
  @IsString()
  @MaxLength(255)
  title: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsNotEmpty({ message: 'A kezdő node ID megadása kötelező.' })
  @IsInt()
  @Min(1) // Feltételezzük, hogy a node ID pozitív
  startingNodeId: number;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean; // Alapértelmezett false lesz a DB-ben
}
