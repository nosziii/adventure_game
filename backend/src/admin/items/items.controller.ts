import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
  Logger,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Patch,
  Delete,
} from '@nestjs/common';
import { AdminItemsService } from './items.service';
import { ItemAdminDto } from './dto'; // Használjuk az index exportot
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { ItemRecord } from '../../game/interfaces/item-record.interface';
import { CreateItemDto, UpdateItemDto } from './dto';

// Helper a mappoláshoz (DB ItemRecord -> ItemAdminDto)
// Mivel az oszlopnevek és DTO mezőnevek itt valószínűleg közel állnak, egyszerűbb lehet
const mapItemRecordToDto = (item: ItemRecord): ItemAdminDto => {
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    type: item.type,
    effect: item.effect,
    usable: item.usable,
    createdAt: item.created_at, // A Date objektum automatikusan ISO stringgé alakul a JSON válaszban
    updatedAt: item.updated_at,
  };
};

@Controller('admin/items')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class AdminItemsController {
  private readonly logger = new Logger(AdminItemsController.name);

  constructor(private readonly adminItemsService: AdminItemsService) {}

  @Get()
  @Roles('admin')
  async findAll(): Promise<ItemAdminDto[]> {
    this.logger.log('Request received for finding all items');
    const items = await this.adminItemsService.findAll();
    return items.map(mapItemRecordToDto);
  }

  @Get(':id')
  @Roles('admin')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<ItemAdminDto> {
    this.logger.log(`Request received for finding item with ID: ${id}`);
    const item = await this.adminItemsService.findOne(id);
    return mapItemRecordToDto(item);
  }

  @Post()
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED) // 201 Created státusz
  async create(@Body() createItemDto: CreateItemDto): Promise<ItemAdminDto> {
    this.logger.log(
      'Request received to create a new item with data:',
      createItemDto,
    );
    // A ValidationPipe-ot feltételezzük globálisan beállítva a main.ts-ben
    try {
      const newItem = await this.adminItemsService.create(createItemDto);
      return mapItemRecordToDto(newItem);
    } catch (error) {
      // A Service már kezeli a specifikus hibákat (Conflict, InternalServer)
      this.logger.error(
        `Error during item creation: ${error?.message || error}`,
      );
      throw error; // Dobjuk tovább a service által adott hibát
    }
  }

  // --- ÚJ: Update Végpont ---
  @Patch(':id') // PATCH a részleges frissítéshez
  @Roles('admin')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateItemDto: UpdateItemDto,
  ): Promise<ItemAdminDto> {
    this.logger.log(
      `Request received to update item with ID: ${id} with data:`,
      updateItemDto,
    );
    try {
      const updatedItem = await this.adminItemsService.update(
        id,
        updateItemDto,
      );
      return mapItemRecordToDto(updatedItem);
    } catch (error) {
      // A Service már kezeli a specifikus hibákat
      this.logger.error(
        `Error during item update for ID ${id}: ${error?.message || error}`,
      );
      throw error;
    }
  }

  // --- ÚJ: Delete Végpont ---
  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT) // 204 No Content státusz sikeres törléskor
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    this.logger.log(`Request received to remove item with ID: ${id}`);
    try {
      await this.adminItemsService.remove(id);
      // Sikeres törléskor nem adunk vissza tartalmat
    } catch (error) {
      // A Service már kezeli a specifikus hibákat
      this.logger.error(
        `Error during item removal for ID ${id}: ${error?.message || error}`,
      );
      throw error;
    }
  }
}
