// src/users/users.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { Knex } from 'knex';
import { KNEX_CONNECTION } from '../database/database.module'; // Importáld a tokent
// Később kellhet a DTO a create metódushoz, de most csak email/passwordHash-t várjunk
// import { RegisterUserDto } from '../auth/dto/register-user.dto';

// Definiáljuk a User interfészt (vagy osztályt), hogy típusbiztos legyen
export interface User {
  id: number
  email: string
  password_hash: string
  role: string
  createdAt: Date
  updatedAt: Date
}

@Injectable()
export class UsersService {
  // Injektáljuk a Knex példányt
  constructor(@Inject(KNEX_CONNECTION) private readonly knex: Knex) {}

  async create(email: string, passwordHash: string): Promise<User> {
    // Használjuk a Knex insert metódusát
    // A returning('*') visszaadja az összes oszlopot a beszúrt sorból
    // A first() csak az első (és egyetlen) eredményt adja vissza
    const [newUser] = await this.knex('users')
      .insert({
        email: email,
        password_hash: passwordHash, // snake_case a DB-ben, ha nincs mapper
        // Ha használsz snakeCaseMappert: password_hash: passwordHash
      })
      .returning('*'); // Visszaadja a beszúrt sort

    // Fontos: A DB 'password_hash'-t ad vissza, a mapper átalakítja 'passwordHash'-re
    // Ha nincs mapper, manuálisan kell kezelni vagy a User interfészt módosítani
    return newUser;
  }

  async findOneByEmail(email: string): Promise<User | undefined> {
    // Használjuk a Knex select és where metódusát
    const user = await this.knex('users')
      .where({ email: email })
      .first(); // Csak az első találatot adja vissza, vagy undefined

    return user;
  }

  // Később lehet findOneById metódus is
  async findOneById(id: number): Promise<User | undefined> {
     const user = await this.knex('users')
      .where({ id: id })
      .first();
     return user;
  }
}