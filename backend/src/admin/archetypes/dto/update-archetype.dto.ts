import { PartialType } from '@nestjs/mapped-types';
import { CreateArchetypeDto } from './create-archetype.dto';

export class UpdateArchetypeDto extends PartialType(CreateArchetypeDto) {}
