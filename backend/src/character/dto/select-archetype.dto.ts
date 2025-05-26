// src/character/dto/select-archetype.dto.ts
import { IsInt, Min } from 'class-validator';

export class SelectArchetypeDto {
  @IsInt({ message: 'Az archetípus ID-nak számnak kell lennie.' })
  @Min(1, { message: 'Az archetípus ID-nak pozitív számnak kell lennie.' })
  archetypeId: number;
}
