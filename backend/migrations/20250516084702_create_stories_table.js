// backend/migrations/YYYYMMDDHHMMSS_create_stories_table.js

const TABLE_NAME = 'stories';

/** @param { import("knex").Knex } knex */
exports.up = async function(knex) {
  console.log(`Attempting to create or ensure ${TABLE_NAME} table and its components using RAW SQL...`);
  try {
    // Tábla és FK constraint létrehozása egy DO blokkban
    await knex.raw(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = '${TABLE_NAME}'
        ) THEN
          CREATE TABLE public.${TABLE_NAME} (
            id SERIAL PRIMARY KEY,
            title VARCHAR(255) NOT NULL UNIQUE,
            description TEXT NULL,
            starting_node_id INTEGER NOT NULL,
            is_published BOOLEAN NOT NULL DEFAULT false,
            created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
            -- FK constraint-et később adjuk hozzá, ha a tábla már biztosan létezik
          );
          RAISE NOTICE 'Table ${TABLE_NAME} created.';
        ELSE
          RAISE NOTICE 'Table ${TABLE_NAME} already exists.';
        END IF;
      END $$;
    `);

    // Foreign Key Constraint hozzáadása külön, miután a tábla biztosan létezik
    // (vagy a DO blokkon belül, de így talán tisztább a hibakeresés)
    const constraintName = `fk_${TABLE_NAME}_starting_node`;
    await knex.raw(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint 
          WHERE conname = '${constraintName}' AND conrelid = (SELECT oid FROM pg_class WHERE relname = '${TABLE_NAME}')
        ) THEN
          ALTER TABLE public.${TABLE_NAME} 
          ADD CONSTRAINT ${constraintName}
          FOREIGN KEY(starting_node_id) 
          REFERENCES public.story_nodes(id)
          ON DELETE RESTRICT;
          RAISE NOTICE 'Constraint ${constraintName} added to ${TABLE_NAME}.';
        ELSE
          RAISE NOTICE 'Constraint ${constraintName} on ${TABLE_NAME} already exists.';
        END IF;
      END $$;
    `);
    
    // Indexek létrehozása (ezek önmagukban idempotensek az IF NOT EXISTS miatt)
    await knex.raw(`CREATE INDEX IF NOT EXISTS idx_${TABLE_NAME}_starting_node_id ON public.${TABLE_NAME} (starting_node_id);`);
    console.log(`Index idx_${TABLE_NAME}_starting_node_id ensured.`);
    await knex.raw(`CREATE INDEX IF NOT EXISTS idx_${TABLE_NAME}_is_published ON public.${TABLE_NAME} (is_published);`);
    console.log(`Index idx_${TABLE_NAME}_is_published ensured.`);

    console.log(`Raw SQL migration for ${TABLE_NAME} table components ensured/finished successfully.`);
  } catch (error) {
    console.error(`Error during raw SQL migration for ${TABLE_NAME} table:`, error);
    throw error;
  }
};

/** @param { import("knex").Knex } knex */
exports.down = async function(knex) {
  console.log(`Attempting to drop ${TABLE_NAME} table...`);
  try {
    // A CASCADE miatt a constraint-ek és indexek is törlődnek
    await knex.raw(`DROP TABLE IF EXISTS public.${TABLE_NAME} CASCADE;`);
    console.log(`Finished dropping ${TABLE_NAME} table.`);
  } catch (error) {
    console.error(`Error during raw SQL rollback for ${TABLE_NAME} table:`, error);
    throw error;
  }
};