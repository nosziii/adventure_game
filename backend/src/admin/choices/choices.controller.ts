// src/admin/choices/admin-choices.controller.ts
import {
    Controller, Get, Param, ParseIntPipe, UseGuards, Logger, Query, DefaultValuePipe, // Query, DefaultValuePipe
    NotFoundException, Post, Body, HttpCode, HttpStatus, BadRequestException,
    InternalServerErrorException, Patch, Delete
} from '@nestjs/common'
import { AdminChoicesService } from './choices.service'
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../auth/guards/roles.guard'
import { Roles } from '../../auth/decorators/roles.decorator'
import { ChoiceRecord } from '../../game/interfaces/choice-record.interface'
import { ChoiceAdminDto, CreateChoiceDto, UpdateChoiceDto } from './dto'

// Helper a mappoláshoz
const mapChoiceRecordToDto = (choice: ChoiceRecord): ChoiceAdminDto => {
    return {
        id: choice.id,
        sourceNodeId: choice.source_node_id,
        targetNodeId: choice.target_node_id,
        text: choice.text,
        requiredItemId: choice.required_item_id,
        itemCostId: choice.item_cost_id,
        requiredStatCheck: choice.required_stat_check,
        // visible_only_if: choice.visible_only_if,
        createdAt: choice.created_at,
        updatedAt: choice.updated_at
    };
};

@Controller('admin/choices') // Alap útvonal: /api/admin/choices
@UseGuards(AuthGuard('jwt'), RolesGuard) // Alkalmazzuk a Guardokat az egész controllerre
export class AdminChoicesController {
    private readonly logger = new Logger(AdminChoicesController.name);

    constructor(private readonly adminChoicesService: AdminChoicesService) {}

    // GET /api/admin/choices - Összes choice listázása (opcionális ?sourceNodeId=X szűréssel)
    @Get()
    @Roles('admin')
    async findAll(
        // A ParseIntPipe itt hibát dobna, ha sourceNodeId nincs megadva és undefined lenne.
        // DefaultValuePipe kell, hogy ha nincs query param, akkor undefined legyen, ne string "undefined".
        @Query('sourceNodeId', new DefaultValuePipe(undefined), new ParseIntPipe({ optional: true }))
        sourceNodeId?: number,
    ): Promise<ChoiceAdminDto[]> {
        this.logger.log(`Request received for finding all choices ${sourceNodeId ? `for sourceNodeId: ${sourceNodeId}` : ''}`);
        const choices = await this.adminChoicesService.findAll(sourceNodeId);
        return choices.map(mapChoiceRecordToDto); // Mappolás DTO-ra
    }

    // GET /api/admin/choices/:id - Egy choice lekérdezése
    @Get(':id')
    @Roles('admin')
    async findOne(@Param('id', ParseIntPipe) id: number): Promise<ChoiceAdminDto> {
        this.logger.log(`Request received for finding choice with ID: ${id}`);
        const choice = await this.adminChoicesService.findOne(id);
        return mapChoiceRecordToDto(choice); // Mappolás DTO-ra
    }

   // --- ÚJ: Create Végpont ---
    @Post()
    @Roles('admin')
    @HttpCode(HttpStatus.CREATED)
    async create(@Body() createChoiceDto: CreateChoiceDto): Promise<ChoiceAdminDto> {
        this.logger.log('Request received to create a new choice');
        try {
             const newChoice = await this.adminChoicesService.create(createChoiceDto);
             return mapChoiceRecordToDto(newChoice);
        } catch (error) {
             if (error instanceof BadRequestException || error instanceof InternalServerErrorException) {
                 throw error; // Továbbadjuk a service által dobott specifikus hibákat
             }
             this.logger.error(`Unhandled error during choice creation: ${error}`);
             throw new InternalServerErrorException('An unexpected error occurred during choice creation.');
        }
    }

    // --- ÚJ: Update Végpont ---
    @Patch(':id') // PATCH a részleges frissítéshez
    @Roles('admin')
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateChoiceDto: UpdateChoiceDto
    ): Promise<ChoiceAdminDto> {
         this.logger.log(`Request received to update choice with ID: ${id}`);
         try {
            const updatedChoice = await this.adminChoicesService.update(id, updateChoiceDto);
            return mapChoiceRecordToDto(updatedChoice);
         } catch (error) {
             if (error instanceof NotFoundException || error instanceof BadRequestException || error instanceof InternalServerErrorException) {
                 throw error;
             }
             this.logger.error(`Unhandled error during choice update for ID ${id}: ${error}`);
             throw new InternalServerErrorException('An unexpected error occurred during choice update.');
         }
    }

    // --- ÚJ: Delete Végpont ---
    @Delete(':id')
    @Roles('admin')
    @HttpCode(HttpStatus.NO_CONTENT) // 204 No Content státuszkód
    async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
        this.logger.log(`Request received to remove choice with ID: ${id}`);
        try {
            await this.adminChoicesService.remove(id);
            // Sikeres törléskor nem adunk vissza tartalmat
        } catch (error) {
             if (error instanceof NotFoundException || error instanceof InternalServerErrorException) {
                 throw error;
             }
             // Ha a service ConflictException-t dobna (pl. ha lenne rá hivatkozás)
             // if (error instanceof ConflictException) { throw error; }
             this.logger.error(`Unhandled error during choice removal for ID ${id}: ${error}`);
             throw new InternalServerErrorException('An unexpected error occurred during choice removal.');
        }
    }
}