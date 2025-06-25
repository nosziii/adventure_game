import {
  IsString,
  IsNotEmpty,
  IsIn,
  IsInt,
  IsOptional,
  ValidateIf,
} from 'class-validator';

// Egyelőre csak a 'attack' akciót támogatjuk
const allowedActions = ['attack', 'use_item', 'defend', 'use_ability'] as const; // Csak ezek az értékek engedélyezettek
export type CombatActionType = (typeof allowedActions)[number]; // Típus létrehozása az engedélyezett stringekből

export class CombatActionDto {
  @IsNotEmpty()
  @IsString()
  @IsIn(allowedActions) // Biztosítja, hogy csak 'attack' lehet (később bővíthető)
  action: CombatActionType;

  // Később ide jöhet pl. itemId, ha tárgyat használunk
  // itemId?: number;

  @ValidateIf((o) => o.action === 'use_item')
  @IsNotEmpty({ message: 'itemId is required when action is use_item' })
  @IsInt({ message: 'itemId must be an integer' })
  itemId?: number;

  @ValidateIf((o) => o.action === 'use_ability') // Csak akkor validáljuk, ha az akció 'use_ability'
  @IsNotEmpty({
    message: 'abilityId megadása kötelező, ha az akció use_ability.',
  })
  @IsInt({ message: 'Az abilityId számnak kell lennie.' })
  abilityId?: number;
}
