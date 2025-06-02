// src/admin/abilities/admin-abilities.controller.ts
import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
  Logger,
  NotFoundException,
  Body,
  Post,
  Patch,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AdminAbilitiesService } from './abilities.service';
import { AbilityAdminDto, CreateAbilityDto, UpdateAbilityDto } from './dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { AbilityRecord } from '../../game/interfaces/ability-record.interface';

const mapAbilityRecordToDto = (ability: AbilityRecord): AbilityAdminDto => {
  if (!ability)
    throw new NotFoundException('Ability record not found for mapping.');
  return {
    id: ability.id,
    name: ability.name,
    description: ability.description,
    type: ability.type,
    effectString: ability.effect_string, // snake_case -> camelCase
    talentPointCost: ability.talent_point_cost, // snake_case -> camelCase
    levelRequirement: ability.level_requirement, // snake_case -> camelCase
    prerequisites: ability.prerequisites,
    allowedArchetypeIds: ability.allowed_archetype_ids, // JSONB-ként tárolva, Knex általában tömbként adja vissza
    createdAt: ability.created_at,
    updatedAt: ability.updated_at,
  };
};

@Controller('admin/abilities')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class AdminAbilitiesController {
  private readonly logger = new Logger(AdminAbilitiesController.name);

  constructor(private readonly adminAbilitiesService: AdminAbilitiesService) {}

  @Get()
  @Roles('admin')
  async findAll(): Promise<AbilityAdminDto[]> {
    this.logger.log('Request received for finding all abilities');
    const abilities = await this.adminAbilitiesService.findAll();
    return abilities.map(mapAbilityRecordToDto);
  }

  @Get(':id')
  @Roles('admin')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<AbilityAdminDto> {
    this.logger.log(`Request received for finding ability with ID: ${id}`);
    const ability = await this.adminAbilitiesService.findOne(id);
    return mapAbilityRecordToDto(ability);
  }

  // --- Create Végpont ---
  @Post()
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createAbilityDto: CreateAbilityDto,
  ): Promise<AbilityAdminDto> {
    this.logger.log(
      'Request received to create a new ability',
      createAbilityDto,
    );
    try {
      const newAbility =
        await this.adminAbilitiesService.create(createAbilityDto);
      return mapAbilityRecordToDto(newAbility);
    } catch (error) {
      this.logger.error(
        `Error during ability creation: ${error?.message || error}`,
      );
      throw error; // A service már a megfelelő HTTP hibát dobja
    }
  }

  // --- Update Végpont ---
  @Patch(':id')
  @Roles('admin')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAbilityDto: UpdateAbilityDto,
  ): Promise<AbilityAdminDto> {
    this.logger.log(
      `Request received to update ability with ID: ${id}`,
      updateAbilityDto,
    );
    try {
      const updatedAbility = await this.adminAbilitiesService.update(
        id,
        updateAbilityDto,
      );
      return mapAbilityRecordToDto(updatedAbility);
    } catch (error) {
      this.logger.error(
        `Error during ability update for ID ${id}: ${error?.message || error}`,
      );
      throw error;
    }
  }

  // ---Delete Végpont ---
  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    this.logger.log(`Request received to remove ability with ID: ${id}`);
    try {
      await this.adminAbilitiesService.remove(id);
    } catch (error) {
      this.logger.error(
        `Error during ability removal for ID ${id}: ${error?.message || error}`,
      );
      throw error;
    }
  }
}
