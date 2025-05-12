// backend/migrations/YYYYMMDDHHMMSS_create_player_progress_table.js

const TABLE_NAME = 'player_progress';

/** @param { import("knex").Knex } knex */
exports.up = async function(knex) {
  console.log(`Attempting to create ${TABLE_NAME} table using RAW SQL...`);
  try {
    await knex.raw(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '${TABLE_NAME}') THEN
          CREATE TABLE public.${TABLE_NAME} (
            id SERIAL PRIMARY KEY,
            character_id INTEGER NOT NULL,
            node_id INTEGER NOT NULL,
            choice_id_taken INTEGER NULL, -- A választás, ami ide vezetett (kezdő node-nál vagy harc utáni node-nál lehet NULL)
            visited_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

            CONSTRAINT fk_character
              FOREIGN KEY(character_id) 
              REFERENCES public.characters(id)
              ON DELETE CASCADE,

            CONSTRAINT fk_node
              FOREIGN KEY(node_id) 
              REFERENCES public.story_nodes(id)
              ON DELETE CASCADE, -- Vagy RESTRICT, ha nem akarjuk, hogy node törlésekor a progress is törlődjön

            CONSTRAINT fk_choice_taken
              FOREIGN KEY(choice_id_taken)
              REFERENCES public.choices(id)
              ON DELETE SET NULL -- Ha egy choice törlődik, a hivatkozás NULL lesz
          );
          
          CREATE INDEX IF NOT EXISTS idx_${TABLE_NAME}_character_id ON public.${TABLE_NAME} (character_id);
          CREATE INDEX IF NOT EXISTS idx_${TABLE_NAME}_node_id ON public.${TABLE_NAME} (node_id);
          CREATE INDEX IF NOT EXISTS idx_${TABLE_NAME}_choice_id_taken ON public.${TABLE_NAME} (choice_id_taken);

          RAISE NOTICE 'Table ${TABLE_NAME} created.';
        ELSE
          RAISE NOTICE 'Table ${TABLE_NAME} already exists.';
        END IF;
      END $$;
    `);
    console.log(`Raw SQL migration for ${TABLE_NAME} table finished.`);
  } catch (error) {
    console.error(`Error during raw SQL migration for ${TABLE_NAME} table:`, error);
    throw error;
  }
};

/** @param { import("knex").Knex } knex */
exports.down = async function(knex) {
  console.log(`Attempting to drop ${TABLE_NAME} table using RAW SQL...`);
  try {
    // Előbb az indexeket és constraint-eket érdemes lehetne törölni, de a DROP TABLE IF EXISTS CASCADE ezt általában kezeli.
    // A biztonság kedvéért:
    // await knex.raw(`DROP INDEX IF EXISTS public.idx_${TABLE_NAME}_character_id;`);
    // await knex.raw(`DROP INDEX IF EXISTS public.idx_${TABLE_NAME}_node_id;`);
    // await knex.raw(`DROP INDEX IF EXISTS public.idx_${TABLE_NAME}_choice_id_taken;`);
    // A foreign key constraint-eket a DROP TABLE CASCADE elvileg viszi.

    await knex.raw(`DROP TABLE IF EXISTS public.${TABLE_NAME} CASCADE;`); // CASCADE, hogy a függő objektumokat is vigye
    console.log(`Finished dropping ${TABLE_NAME} table.`);
  } catch (error) {
    console.error(`Error during raw SQL rollback for ${TABLE_NAME} table:`, error);
    throw error;
  }
};