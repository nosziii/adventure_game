import { IsInt, Min } from 'class-validator';
export class BeginStoryWithArchetypeDto {
  @IsInt()
  @Min(1)
  archetypeId: number;
}
