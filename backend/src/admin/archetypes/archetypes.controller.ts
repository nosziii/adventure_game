import {
  Controller,
  Get,
  Post,
  Patch,
  Delete, // Post, Patch, Delete hozzáadva
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
  Logger,
  HttpCode,
  HttpStatus, // HttpCode, HttpStatus import
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  BadRequestException, // Szükséges exceptionök
} from '@nestjs/common';
import { AdminArchetypesService } from './archetypes.service';
import {
  ArchetypeAdminDto,
  CreateArchetypeDto,
  UpdateArchetypeDto,
} from './dto'; // DTO importok
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CharacterArchetypeRecord } from '../../game/interfaces/character-archetype-record.interface';

// Helper a mappoláshoz (DB Record -> DTO) - FRISSÍTVE
const mapArchetypeRecordToDto = (
  archetype: CharacterArchetypeRecord,
): ArchetypeAdminDto => {
  if (!archetype)
    throw new NotFoundException('Archetype record not found for mapping.');
  return {
    id: archetype.id,
    name: archetype.name,
    description: archetype.description,
    iconPath: archetype.icon_path,
    baseHealthBonus: archetype.base_health_bonus,
    baseSkillBonus: archetype.base_skill_bonus,
    baseLuckBonus: archetype.base_luck_bonus,
    baseStaminaBonus: archetype.base_stamina_bonus,
    baseDefenseBonus: archetype.base_defense_bonus,
    startingAbilityIds: archetype.starting_ability_ids, // Knex a JSONB-t általában tömbként/objektumként adja vissza
    learnableAbilityIds: archetype.learnable_ability_ids,
    createdAt: archetype.created_at,
    updatedAt: archetype.updated_at,
  };
};

@Controller('admin/archetypes')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class AdminArchetypesController {
  private readonly logger = new Logger(AdminArchetypesController.name);

  constructor(
    private readonly adminArchetypesService: AdminArchetypesService,
  ) {}

  @Get()
  @Roles('admin')
  async findAll(): Promise<ArchetypeAdminDto[]> {
    this.logger.log('Request received for finding all archetypes');
    const archetypes = await this.adminArchetypesService.findAll();
    return archetypes.map(mapArchetypeRecordToDto);
  }

  @Get(':id')
  @Roles('admin')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ArchetypeAdminDto> {
    this.logger.log(`Request received for finding archetype with ID: ${id}`);
    const archetype = await this.adminArchetypesService.findOne(id);
    return mapArchetypeRecordToDto(archetype);
  }

  // --- Create Végpont ---
  @Post()
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createArchetypeDto: CreateArchetypeDto,
  ): Promise<ArchetypeAdminDto> {
    this.logger.log(
      'Request received to create a new archetype',
      createArchetypeDto,
    );
    try {
      const newArchetype =
        await this.adminArchetypesService.create(createArchetypeDto);
      return mapArchetypeRecordToDto(newArchetype);
    } catch (error) {
      this.logger.error(
        `Error during archetype creation: ${error?.message || error}`,
      );
      throw error;
    }
  }

  // --- Update Végpont ---
  @Patch(':id')
  @Roles('admin')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateArchetypeDto: UpdateArchetypeDto,
  ): Promise<ArchetypeAdminDto> {
    this.logger.log(
      `Request received to update archetype with ID: ${id}`,
      updateArchetypeDto,
    );
    try {
      const updatedArchetype = await this.adminArchetypesService.update(
        id,
        updateArchetypeDto,
      );
      return mapArchetypeRecordToDto(updatedArchetype);
    } catch (error) {
      this.logger.error(
        `Error during archetype update for ID ${id}: ${error?.message || error}`,
      );
      throw error;
    }
  }

  // --- Delete Végpont ---
  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    this.logger.log(`Request received to remove archetype with ID: ${id}`);
    try {
      await this.adminArchetypesService.remove(id);
    } catch (error) {
      this.logger.error(
        `Error during archetype removal for ID ${id}: ${error?.message || error}`,
      );
      throw error;
    }
  }
}
