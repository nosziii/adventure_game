import {
  Injectable,
  Inject,
  NotFoundException,
  Logger,
  InternalServerErrorException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Knex } from 'knex';
import { KNEX_CONNECTION } from '../../database/database.module'; // Igazítsd az útvonalat!
import { StoryNode } from '../../game/interfaces/story-node.interface'; // Használjuk a meglévő interfészt
import { CreateNodeDto, UpdateNodeDto, NodeDto } from './dto'; // DTO-k importálása
import { ChoiceRecord } from '../../game/interfaces/choice-record.interface';

@Injectable()
export class AdminNodesService {
  private readonly logger = new Logger(AdminNodesService.name);

  constructor(@Inject(KNEX_CONNECTION) private readonly knex: Knex) {}

  // --- MAPPER SEGÉDFÜGGVÉNYEK
  // DTO (camelCase) -> DB (snake_case)
  private dtoToDbNode(dto: CreateNodeDto | UpdateNodeDto): Partial<StoryNode> {
    const dbData: Partial<StoryNode> = {};
    if (dto.text !== undefined) dbData.text = dto.text;
    if (dto.image !== undefined) dbData.image = dto.image;
    if (dto.is_end !== undefined) dbData.is_end = dto.is_end;
    if (dto.health_effect !== undefined)
      dbData.health_effect = dto.health_effect;
    if (dto.item_reward_id !== undefined)
      dbData.item_reward_id = dto.item_reward_id;
    if (dto.enemy_id !== undefined) dbData.enemy_id = dto.enemy_id;
    if (dto.victoryNodeId !== undefined)
      dbData.victory_node_id = dto.victoryNodeId;
    if (dto.defeatNodeId !== undefined)
      dbData.defeat_node_id = dto.defeatNodeId;
    // created_at, updated_at automatikus
    return dbData;
  }

  // DB (snake_case) -> DTO (camelCase) - Erre a controllerben lesz szükség, de itt is lehetne
  // private dbNodeToDto(node: StoryNode): NodeDto { ... }

  // Összes node lekérdezése
  async findAll(): Promise<StoryNode[]> {
    this.logger.log('Fetching all story nodes for admin');
    return this.knex<StoryNode>('story_nodes').select('*').orderBy('id');
  }

  // Egy node lekérdezése ID alapján
  async findOne(id: number): Promise<StoryNode> {
    this.logger.log(`Workspaceing story node with ID: ${id}`);
    const node = await this.knex<StoryNode>('story_nodes')
      .where({ id })
      .first();
    if (!node) {
      this.logger.warn(`Story node with ID ${id} not found.`);
      throw new NotFoundException(`Story node with ID ${id} not found.`);
    }
    return node;
  }

  async create(createNodeDto: CreateNodeDto): Promise<StoryNode> {
    this.logger.log('Attempting to create new story node');
    const dbNodeData = this.dtoToDbNode(createNodeDto);
    // Alapértelmezett érték beállítása, ha a DTO nem tartalmazza és a DB séma nem defaultolja
    if (dbNodeData.is_end === undefined) {
      dbNodeData.is_end = false;
    }
    try {
      const [newNode] = await this.knex('story_nodes')
        .insert(dbNodeData)
        .returning('*');
      this.logger.log(`Story node created with ID: ${newNode.id}`);
      return newNode;
    } catch (error: any) {
      this.logger.error(`Failed to create story node: ${error}`, error.stack);
      // Itt lehetne specifikusabb hibakezelés FK sértésekre (item_reward_id, enemy_id, victory/defeat_node_id)
      if (error.code === '23503') {
        // Foreign key violation
        throw new BadRequestException(
          'Invalid reference ID provided (e.g., item, enemy, or target node does not exist).',
        );
      }
      throw new InternalServerErrorException('Failed to create story node.');
    }
  }

  // ÚJ: Node Frissítése
  async update(id: number, updateNodeDto: UpdateNodeDto): Promise<StoryNode> {
    this.logger.log(`Attempting to update story node with ID: ${id}`);
    const dbNodeUpdates = this.dtoToDbNode(updateNodeDto);

    if (Object.keys(dbNodeUpdates).length === 0) {
      this.logger.warn(`Update called for node ${id} with empty data.`);
      return this.findOne(id);
    }
    try {
      const [updatedNode] = await this.knex('story_nodes')
        .where({ id })
        .update(dbNodeUpdates)
        .returning('*');
      if (!updatedNode) {
        throw new NotFoundException(`Story node with ID ${id} not found.`);
      }
      this.logger.log(`Story node ${id} updated successfully.`);
      return updatedNode;
    } catch (error: any) {
      this.logger.error(
        `Failed to update story node ${id}: ${error}`,
        error.stack,
      );
      if (error.code === '23503') {
        // Foreign key violation
        throw new BadRequestException(
          'Invalid reference ID provided for update (e.g., item, enemy, or target node does not exist).',
        );
      }
      throw new InternalServerErrorException('Failed to update story node.');
    }
  }

  // ÚJ: Node Törlése
  async remove(id: number): Promise<void> {
    this.logger.log(`Attempting to remove story node with ID: ${id}`);
    try {
      // Törlési kísérlet
      const numDeleted = await this.knex('story_nodes').where({ id }).del();

      if (numDeleted === 0) {
        this.logger.warn(`Story node with ID ${id} not found for removal.`);
        throw new NotFoundException(`Story node with ID ${id} not found.`);
      }
      this.logger.log(`Story node ${id} removed successfully.`);
      // Nem adunk vissza semmit sikeres törléskor (void)
    } catch (error: any) {
      this.logger.error(
        `Failed to remove story node ${id}: ${error}`,
        error.stack,
      );
      // Ellenőrizzük, hogy a hiba Foreign Key sértés miatt volt-e (pl. egy Choice hivatkozik rá)
      if (error.code === '23503') {
        // PostgreSQL foreign key violation error code
        throw new ConflictException(
          `Cannot delete node ${id} because other records (e.g., choices) depend on it.`,
        );
      }
      throw new InternalServerErrorException('Failed to remove story node.');
    }
  }

  // A TELJES GRÁFHOZ
  async getStoryGraphData(): Promise<{
    nodes: StoryNode[];
    choices: ChoiceRecord[];
  }> {
    this.logger.log('Fetching all data for story graph');
    try {
      const nodes = await this.knex<StoryNode>('story_nodes')
        .select('*')
        .orderBy('id');
      const choices = await this.knex<ChoiceRecord>('choices')
        .select('*')
        .orderBy('id');
      return { nodes, choices };
    } catch (error) {
      this.logger.error('Failed to fetch story graph data', error.stack);
      throw new InternalServerErrorException(
        'Could not retrieve story graph data.',
      );
    }
  }
}
