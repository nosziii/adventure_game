import { IsInt, IsNotEmpty } from 'class-validator'

export class UseItemDto {
  @IsNotEmpty()
  @IsInt()
  itemId: number
}