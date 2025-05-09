import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  MaxLength,
} from 'class-validator';

// TODO: Később a type lehetne egy Enum a validációhoz
// export enum ItemType { WEAPON = 'weapon', POTION = 'potion', KEY = 'key', ARMOR = 'armor', JUNK = 'junk' }

export class CreateItemDto {
  @IsNotEmpty({ message: 'A név megadása kötelező.' })
  @IsString()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsNotEmpty({ message: 'A típus megadása kötelező.' })
  @IsString()
  // @IsIn(Object.values(ItemType)) // Később enum validáció
  type: string; // pl. weapon, potion, key, armor

  @IsOptional()
  @IsString()
  @MaxLength(255)
  effect?: string | null;

  @IsOptional()
  @IsBoolean()
  usable?: boolean; // Alapértelmezett false lesz a DB-ben
}
