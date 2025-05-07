// src/admin/nodes/dto/update-node.dto.ts
import { PartialType } from '@nestjs/mapped-types'; // Vagy @nestjs/swagger, ha azt használod
import { CreateNodeDto } from './create-node.dto';

// Az Update DTO örökli a Create DTO-t, de minden mező opcionális lesz
export class UpdateNodeDto extends PartialType(CreateNodeDto) {}