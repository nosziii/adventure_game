import { Module, Global } from '@nestjs/common'
import type { Knex } from 'knex'
import knex from 'knex'
import knexSnakeCaseMappers from 'objection'


export const KNEX_CONNECTION = 'KNEX_CONNECTION'

const kenxProvider = {
  provide: KNEX_CONNECTION,
  useFactory: async (): Promise<Knex> => {
    const dbUrl = process.env.DATABASE_URL

    if (!dbUrl) {
      throw new Error('DATABASE_URL environment variable is not set.')
    }
    const knexConfig: Knex.Config = {
      client: 'pg',
      connection: dbUrl,
      pool: { min: 2, max: 10 },
      ...knexSnakeCaseMappers,
    }
    return knex(knexConfig)
  },
}



@Global()

@Module({
    providers: [kenxProvider],
  exports: [kenxProvider]
})

export class DatabaseModule {}