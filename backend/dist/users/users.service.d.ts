import { Knex } from 'knex';
export interface User {
    id: number;
    email: string;
    password_hash: string;
    role: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare class UsersService {
    private readonly knex;
    constructor(knex: Knex);
    create(email: string, passwordHash: string): Promise<User>;
    findOneByEmail(email: string): Promise<User | undefined>;
    findOneById(id: number): Promise<User | undefined>;
}
