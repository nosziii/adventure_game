import { Knex } from 'knex';
export interface Character {
    id: number;
    user_id: number;
    name: string | null;
    health: number;
    skill: number;
    luck: number | null;
    stamina: number | null;
    current_node_id: number | null;
    created_at: Date;
    updated_at: Date;
}
export declare class CharacterService {
    private readonly knex;
    private readonly logger;
    constructor(knex: Knex);
    findByUserId(userId: number): Promise<Character | undefined>;
    findById(id: number): Promise<Character | undefined>;
    createCharacter(userId: number): Promise<Character>;
    updateCharacter(characterId: number, updates: Partial<Omit<Character, 'id' | 'user_id' | 'created_at' | 'updated_at'>>): Promise<Character>;
}
