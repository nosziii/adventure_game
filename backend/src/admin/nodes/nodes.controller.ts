// src/admin/nodes/admin-nodes.controller.ts
import {
    Controller, Get, Post, Put, Patch, Delete, // Új metódusok
    Param, Body, ParseIntPipe, UseGuards, Logger,
    NotFoundException, HttpCode, HttpStatus, // HttpStatus és HttpCode
    ConflictException, InternalServerErrorException // Hibakezeléshez
} from '@nestjs/common'
import { AdminNodesService } from './nodes.service'
import { NodeDto, CreateNodeDto, UpdateNodeDto } from './dto' // Használjuk a válasz DTO-t
import { AuthGuard } from '@nestjs/passport' // JWT Guard
import { RolesGuard } from '../../auth/guards/roles.guard' // Roles Guard
import { Roles } from '../../auth/decorators/roles.decorator' // Roles dekorátor
import { StoryNode } from '../../game/interfaces/story-node.interface' // Használjuk a meglévő interfészt

// Helper a mappoláshoz (vagy tedd külön fájlba)
const mapStoryNodeToNodeDto = (node: StoryNode): NodeDto => {
    return {
        id: node.id,
        text: node.text,
        image: node.image,
        is_end: node.is_end,
        health_effect: node.health_effect,
        item_reward_id: node.item_reward_id,
        enemy_id: node.enemy_id,
        created_at: node.created_at,
        updated_at: node.updated_at
    };
};

@Controller('admin/nodes') // Alap útvonal: /api/admin/nodes
@UseGuards(AuthGuard('jwt'), RolesGuard) // Alkalmazzuk a Guardokat az egész controllerre
export class AdminNodesController {
    private readonly logger = new Logger(AdminNodesController.name);

    constructor(private readonly adminNodesService: AdminNodesService) {}

@Get()
    @Roles('admin')
    async findAll(): Promise<NodeDto[]> {
        this.logger.log('Request received for finding all nodes');
        const nodes = await this.adminNodesService.findAll();
        return nodes.map(mapStoryNodeToNodeDto); // Mappolás DTO-ra
    }

    @Get(':id')
    @Roles('admin')
    async findOne(@Param('id', ParseIntPipe) id: number): Promise<NodeDto> {
        this.logger.log(`Request received for finding node with ID: ${id}`);
        // A service már dob NotFoundException-t, a NestJS kezeli 404-ként
        const node = await this.adminNodesService.findOne(id);
        return mapStoryNodeToNodeDto(node); // Mappolás DTO-ra
    }

     // --- Create Végpont ---
    @Post()
    @Roles('admin')
    @HttpCode(HttpStatus.CREATED) // 201 Created státuszkód
    async create(@Body(/* new ValidationPipe() - ha nincs globálisan */) createNodeDto: CreateNodeDto): Promise<NodeDto> {
        this.logger.log('Request received to create a new node');
        try {
             const newNode = await this.adminNodesService.create(createNodeDto);
             return mapStoryNodeToNodeDto(newNode); // Mappolás DTO-ra
        } catch (error) {
             // Service már dob InternalServerErrorException-t
             this.logger.error(`Error during node creation: ${error}`);
             throw error;
        }
    }

    // ---Update Végpont ---
    // Használjunk PATCH-et a részleges frissítéshez, mert UpdateNodeDto PartialType
    @Patch(':id')
    @Roles('admin')
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body(/* new ValidationPipe() */) updateNodeDto: UpdateNodeDto
    ): Promise<NodeDto> {
         this.logger.log(`Request received to update node with ID: ${id}`);
         try {
            const updatedNode = await this.adminNodesService.update(id, updateNodeDto);
            return mapStoryNodeToNodeDto(updatedNode); // Mappolás DTO-ra
         } catch (error) {
             // Service dob NotFoundException-t vagy InternalServerErrorException-t
             this.logger.error(`Error during node update for ID ${id}: ${error}`);
              if (error instanceof NotFoundException) {
                 throw new NotFoundException(error.message);
             }
             throw error; // Egyéb hibák továbbdobása (500)
         }
    }

    // --- Delete Végpont ---
    @Delete(':id')
    @Roles('admin')
    @HttpCode(HttpStatus.NO_CONTENT) // 204 No Content státuszkód sikeres törléskor
    async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
        this.logger.log(`Request received to remove node with ID: ${id}`);
        try {
            await this.adminNodesService.remove(id);
            // Sikeres törléskor nem adunk vissza tartalmat
        } catch (error) {
             // Service dob NotFoundException-t, ConflictException-t vagy InternalServerErrorException-t
             this.logger.error(`Error during node removal for ID ${id}: ${error}`);
             if (error instanceof NotFoundException || error instanceof ConflictException) {
                 throw error; // Továbbadjuk a 404 vagy 409 hibát
             }
             throw error; // Egyéb hibák (500)
        }
    }
}