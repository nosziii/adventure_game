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
  NotFoundException,
  ConflictException,
  HttpCode,
  HttpStatus, // HttpCode, HttpStatus, ConflictException import
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { AdminEnemiesService } from './enemies.service';
import { EnemyAdminDto, CreateEnemyDto, UpdateEnemyDto } from './dto'; // Használjuk az index exportot
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { EnemyRecord } from '../../game/interfaces/enemy-record.interface';

// Helper a mappoláshoz (DB EnemyRecord -> EnemyAdminDto)
const mapEnemyRecordToDto = (enemy: EnemyRecord): EnemyAdminDto => {
  return {
    id: enemy.id,
    name: enemy.name,
    health: enemy.health,
    skill: enemy.skill,
    attackDescription: enemy.attack_description, // snake_case -> camelCase
    defeatText: enemy.defeat_text,
    itemDropId: enemy.item_drop_id,
    xpReward: enemy.xp_reward,
    createdAt: enemy.created_at,
    updatedAt: enemy.updated_at,
  };
};

@Controller('admin/enemies')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class AdminEnemiesController {
  private readonly logger = new Logger(AdminEnemiesController.name);

  constructor(private readonly adminEnemiesService: AdminEnemiesService) {}

  @Get()
  @Roles('admin')
  async findAll(): Promise<EnemyAdminDto[]> {
    this.logger.log('Request received for finding all enemies');
    const enemies = await this.adminEnemiesService.findAll();
    return enemies.map(mapEnemyRecordToDto);
  }

  @Get(':id')
  @Roles('admin')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<EnemyAdminDto> {
    this.logger.log(`Request received for finding enemy with ID: ${id}`);
    const enemy = await this.adminEnemiesService.findOne(id);
    return mapEnemyRecordToDto(enemy);
  }

  @Post()
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createEnemyDto: CreateEnemyDto): Promise<EnemyAdminDto> {
    this.logger.log('Request received to create a new enemy', createEnemyDto);
    try {
      const newEnemy = await this.adminEnemiesService.create(createEnemyDto);
      return mapEnemyRecordToDto(newEnemy);
    } catch (error) {
      this.logger.error(
        `Error during enemy creation: ${error?.message || error}`,
      );
      throw error;
    }
  }

  @Patch(':id')
  @Roles('admin')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEnemyDto: UpdateEnemyDto,
  ): Promise<EnemyAdminDto> {
    this.logger.log(
      `Request received to update enemy with ID: ${id}`,
      updateEnemyDto,
    );
    try {
      const updatedEnemy = await this.adminEnemiesService.update(
        id,
        updateEnemyDto,
      );
      return mapEnemyRecordToDto(updatedEnemy);
    } catch (error) {
      this.logger.error(
        `Error during enemy update for ID ${id}: ${error?.message || error}`,
      );
      throw error;
    }
  }

  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    this.logger.log(`Request received to remove enemy with ID: ${id}`);
    try {
      await this.adminEnemiesService.remove(id);
    } catch (error) {
      this.logger.error(
        `Error during enemy removal for ID ${id}: ${error?.message || error}`,
      );
      throw error;
    }
  }
}
