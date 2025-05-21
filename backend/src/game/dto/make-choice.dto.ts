import { IsInt, IsNotEmpty } from 'class-validator';

export class MakeChoiceDto {
  @IsNotEmpty({ message: 'A choiceId megadása kötelező.' })
  @IsInt({ message: 'A choiceId számnak kell lennie.' })
  choiceId: number;
}
