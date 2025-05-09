import { PartialType } from '@nestjs/mapped-types';
import { CreateEnemyDto } from './create-enemy.dto';

export class UpdateEnemyDto extends PartialType(CreateEnemyDto) {}
