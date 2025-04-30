import { IsString, IsNotEmpty, IsIn, IsInt, IsOptional, ValidateIf } from 'class-validator'

// Egyelőre csak a 'attack' akciót támogatjuk
const allowedActions = ['attack', 'use_item'] as const // Csak ezek az értékek engedélyezettek
type CombatActionType = typeof allowedActions[number] // Típus létrehozása az engedélyezett stringekből

export class CombatActionDto {
  @IsNotEmpty()
  @IsString()
  @IsIn(allowedActions) // Biztosítja, hogy csak 'attack' lehet (később bővíthető)
  action: CombatActionType

  // Később ide jöhet pl. itemId, ha tárgyat használunk
    // itemId?: number;
    
    @ValidateIf((o) => o.action === 'use_item')
    @IsNotEmpty({ message: 'itemId is required when action is use_item' })
    @IsInt({ message: 'itemId must be an integer' })
    itemId?: number
}