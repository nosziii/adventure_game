import { IsInt, Min } from 'class-validator';
export class LearnAbilityDto {
  @IsInt()
  @Min(1)
  abilityId: number;
}
