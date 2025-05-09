import { Injectable, Inject, NotFoundException, Logger, InternalServerErrorException, BadRequestException } from '@nestjs/common'
import { Knex } from 'knex'
import { KNEX_CONNECTION } from '../../database/database.module'
// Használjuk a ChoiceRecord interfészt a game mappából
import { ChoiceRecord } from '../../game/interfaces/choice-record.interface'
// DTO-kat a controller használja majd a válaszhoz/kéréshez
import { CreateChoiceDto, UpdateChoiceDto } from './dto'

@Injectable()
export class AdminChoicesService {
    private readonly logger = new Logger(AdminChoicesService.name)

    constructor(@Inject(KNEX_CONNECTION) private readonly knex: Knex) { }
    
     // --- MAPPER SEGÉDFÜGGVÉNY: DTO (camelCase) -> DB (snake_case) ---
    // Csak azokat a mezőket tartalmazza, amiket a DTO-ból kapunk és a DB-ben is snake_case
    private dtoToDbChoice(dto: CreateChoiceDto | UpdateChoiceDto): Partial<Omit<ChoiceRecord, 'id' | 'created_at' | 'updated_at'>> {
        const dbData: any = {}; // Használjunk any-t itt az egyszerűbb hozzárendeléshez
        if (dto.sourceNodeId !== undefined) dbData.source_node_id = dto.sourceNodeId;
        if (dto.targetNodeId !== undefined) dbData.target_node_id = dto.targetNodeId;
        if (dto.text !== undefined) dbData.text = dto.text;
        if (dto.requiredItemId !== undefined) dbData.required_item_id = dto.requiredItemId;
        if (dto.itemCostId !== undefined) dbData.item_cost_id = dto.itemCostId;
        if (dto.requiredStatCheck !== undefined) dbData.required_stat_check = dto.requiredStatCheck;
        // visible_only_if, ha hozzáadtuk a DTO-hoz
        // if (dto.visible_only_if !== undefined) dbData.visible_only_if = dto.visible_only_if;
        return dbData;
    }

    // Összes choice lekérdezése, opcionálisan source_node_id alapján szűrve
    async findAll(sourceNodeId?: number): Promise<ChoiceRecord[]> {
        this.logger.log(`Workspaceing all choices for admin ${sourceNodeId ? `for sourceNodeId: ${sourceNodeId}` : ''}`)
        let query = this.knex<ChoiceRecord>('choices').select('*')
        if (sourceNodeId) {
            query = query.where({ source_node_id: sourceNodeId })
        }
        return query.orderBy('id')
    }

    // Egy choice lekérdezése ID alapján
    async findOne(id: number): Promise<ChoiceRecord> {
         this.logger.log(`Workspaceing choice with ID: ${id}`);
         const choice = await this.knex<ChoiceRecord>('choices').where({ id }).first()
         if (!choice) {
             this.logger.warn(`Choice with ID ${id} not found.`)
             throw new NotFoundException(`Choice with ID ${id} not found.`)
         }
         return choice
    }

     // --- ÚJ METÓDUS: Choice Létrehozása ---
    async create(createChoiceDto: CreateChoiceDto): Promise<ChoiceRecord> {
        this.logger.log(`Attempting to create new choice`);
        const dbChoiceData = this.dtoToDbChoice(createChoiceDto);
        try {
            const [newChoice] = await this.knex('choices')
                                      .insert(dbChoiceData)
                                      .returning('*');
            this.logger.log(`Choice created with ID: ${newChoice.id}`);
            return newChoice; // Visszaadjuk a DB objektumot (snake_case)
        } catch (error: any) {
            this.logger.error(`Failed to create choice: ${error}`, error.stack);
            // Ellenőrizzük, hogy a hiba Foreign Key sértés miatt volt-e (pl. nem létező node ID)
            if (error.code === '23503') { // PostgreSQL foreign key violation
                throw new BadRequestException('Invalid source_node_id or target_node_id (node does not exist).');
            }
            throw new InternalServerErrorException('Failed to create choice.');
        }
    }

    // --- ÚJ METÓDUS: Choice Frissítése ---
    async update(id: number, updateChoiceDto: UpdateChoiceDto): Promise<ChoiceRecord> {
        this.logger.log(`Attempting to update choice with ID: ${id}`);
        const dbChoiceUpdates = this.dtoToDbChoice(updateChoiceDto);

        if (Object.keys(dbChoiceUpdates).length === 0) {
            this.logger.warn(`Update called for choice ${id} with empty data.`);
            return this.findOne(id); // Visszaadjuk a meglévőt
        }

        try {
            const [updatedChoice] = await this.knex('choices')
                                          .where({ id })
                                          .update(dbChoiceUpdates)
                                          .returning('*');
            if (!updatedChoice) {
                this.logger.warn(`Choice with ID ${id} not found for update.`);
                throw new NotFoundException(`Choice with ID ${id} not found.`);
            }
            this.logger.log(`Choice ${id} updated successfully.`);
            return updatedChoice; // Visszaadjuk a DB objektumot (snake_case)
        } catch (error: any) {
            this.logger.error(`Failed to update choice ${id}: ${error}`, error.stack);
            if (error.code === '23503') { // PostgreSQL foreign key violation
                throw new BadRequestException('Invalid source_node_id or target_node_id for update.');
            }
            throw new InternalServerErrorException('Failed to update choice.');
        }
    }

    // --- ÚJ METÓDUS: Choice Törlése ---
    async remove(id: number): Promise<void> {
         this.logger.log(`Attempting to remove choice with ID: ${id}`);
         try {
             const numDeleted = await this.knex('choices')
                                       .where({ id })
                                       .del();
             if (numDeleted === 0) {
                 this.logger.warn(`Choice with ID ${id} not found for removal.`);
                 throw new NotFoundException(`Choice with ID ${id} not found.`);
             }
             this.logger.log(`Choice ${id} removed successfully.`);
         } catch (error: any) {
             this.logger.error(`Failed to remove choice ${id}: ${error}`, error.stack);
             // A Choice törlésének általában nincs FK constraintje, ami megakadályozná,
             // de ha lenne (pl. egy choice_effects tábla), akkor itt ConflictException-t dobhatnánk.
             throw new InternalServerErrorException('Failed to remove choice.');
         }
    }
}