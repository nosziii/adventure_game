import { IsInt, IsNotEmpty } from 'class-validator'

export class MakeChoiceDto {
  @IsNotEmpty()
  @IsInt()
  choiceId: number
}