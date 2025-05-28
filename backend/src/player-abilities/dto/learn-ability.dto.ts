import { IsInt, Min } from 'class-validator';

export class LearnAbilityRequestDto {
  @IsInt({ message: 'A képesség ID-nak számnak kell lennie.' })
  @Min(1, { message: 'A képesség ID-nak pozitív számnak kell lennie.' })
  abilityId: number;
}
