import { IsString, IsNotEmpty, IsIn } from 'class-validator';

const ALLOWED_STATS_TO_SPEND_ON = [
  'skill',
  'luck',
  'defense',
  'stamina',
] as const;
export type SpendableStatName = (typeof ALLOWED_STATS_TO_SPEND_ON)[number];

export class SpendTalentPointDto {
  @IsNotEmpty({ message: 'A statisztika nevének megadása kötelező.' })
  @IsString()
  @IsIn(ALLOWED_STATS_TO_SPEND_ON, { message: 'Érvénytelen statisztika név.' })
  statName: SpendableStatName;
}
