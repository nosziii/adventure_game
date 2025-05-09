import { IsString, IsNotEmpty, IsOptional, IsInt, Min, MaxLength } from 'class-validator'

export class CreateChoiceDto {
    @IsNotEmpty({ message: 'A forrás csomópont ID megadása kötelező.' })
    @IsInt()
    sourceNodeId: number;

    @IsNotEmpty({ message: 'A cél csomópont ID megadása kötelező.' })
    @IsInt()
    targetNodeId: number;

    @IsNotEmpty({ message: 'A választás szövegének megadása kötelező.' })
    @IsString()
    @MaxLength(255) // Illeszkedjen a DB sémához
    text: string;

    @IsOptional()
    @IsInt()
    @Min(1)
    requiredItemId?: number | null

    @IsOptional()
    @IsInt()
    @Min(1)
    itemCostId?: number | null

    @IsOptional()
    @IsString()
    @MaxLength(255)
    requiredStatCheck?: string | null

    // @IsOptional()
    // @IsString()
    // @MaxLength(255)
    // visible_only_if?: string | null;
}