// backend/migrations/YYYYMMDDHHMMSS_create_character_archetypes_table.js

const TABLE_NAME = 'character_archetypes';

/** @param { import("knex").Knex } knex */
exports.up = async function(knex) {
  console.log(`Attempting to create ${TABLE_NAME} table using RAW SQL...`);
  try {
    await knex.raw(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = '${TABLE_NAME}'
        ) THEN
          CREATE TABLE public.${TABLE_NAME} (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL UNIQUE,
            description TEXT NOT NULL,
            icon_path VARCHAR(255) NULL,
            base_health_bonus INTEGER NOT NULL DEFAULT 0,
            base_skill_bonus INTEGER NOT NULL DEFAULT 0,
            base_luck_bonus INTEGER NOT NULL DEFAULT 0,
            base_stamina_bonus INTEGER NOT NULL DEFAULT 0,
            base_defense_bonus INTEGER NOT NULL DEFAULT 0,
            starting_ability_ids JSONB NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
          RAISE NOTICE 'Table ${TABLE_NAME} created.';
        ELSE
          RAISE NOTICE 'Table ${TABLE_NAME} already exists.';
        END IF;
      END $$;
    `);
    console.log(`Raw SQL migration for ${TABLE_NAME} table finished successfully.`);
  } catch (error) {
    console.error(`Error during raw SQL migration for ${TABLE_NAME} table:`, error);
    throw error;
  }
};

/** @param { import("knex").Knex } knex */
exports.down = async function(knex) {
  console.log(`Attempting to drop ${TABLE_NAME} table...`);
  try {
    await knex.raw(`DROP TABLE IF EXISTS public.${TABLE_NAME} CASCADE;`);
    console.log(`Finished dropping ${TABLE_NAME} table.`);
  } catch (error) {
    console.error(`Error during raw SQL rollback for ${TABLE_NAME} table:`, error);
    throw error;
  }
};