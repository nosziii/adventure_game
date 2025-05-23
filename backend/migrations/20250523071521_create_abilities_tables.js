// backend/migrations/YYYYMMDDHHMMSS_create_abilities_tables.js

const ABILITIES_TABLE = 'abilities';
const CHAR_STORY_ABILITIES_TABLE = 'character_story_abilities';

/** @param { import("knex").Knex } knex */
exports.up = async function(knex) {
  console.log(`Attempting to create ${ABILITIES_TABLE} and ${CHAR_STORY_ABILITIES_TABLE} tables using RAW SQL...`);
  try {
    // --- abilities tábla ---
    await knex.raw(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = '${ABILITIES_TABLE}'
        ) THEN
          CREATE TABLE public.${ABILITIES_TABLE} (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL UNIQUE,
            description TEXT NOT NULL,
            type VARCHAR(50) NOT NULL, -- e.g., 'PASSIVE_STAT', 'ACTIVE_COMBAT_ACTION', 'PASSIVE_COMBAT_MODIFIER'
            effect_string TEXT NULL,    -- e.g., "stamina+10", "damage_multiplier:1.5;stamina_cost:10"
            talent_point_cost INTEGER NOT NULL DEFAULT 1,
            level_requirement INTEGER NOT NULL DEFAULT 1,
            prerequisites JSONB NULL,   -- e.g., '[1, 5]' (array of other ability IDs)
            created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
          RAISE NOTICE 'Table ${ABILITIES_TABLE} created.';
        ELSE
          RAISE NOTICE 'Table ${ABILITIES_TABLE} already exists.';
        END IF;
      END $$;
    `);
    console.log(`CREATE TABLE IF NOT EXISTS for ${ABILITIES_TABLE} executed or table already existed.`);

    // --- character_story_abilities tábla ---
    await knex.raw(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = '${CHAR_STORY_ABILITIES_TABLE}'
        ) THEN
          CREATE TABLE public.${CHAR_STORY_ABILITIES_TABLE} (
            id SERIAL PRIMARY KEY,
            character_story_progress_id INTEGER NOT NULL,
            ability_id INTEGER NOT NULL,
            learned_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            rank INTEGER NOT NULL DEFAULT 1, -- For future: ability ranks/levels
            
            CONSTRAINT fk_char_story_progress
              FOREIGN KEY(character_story_progress_id) 
              REFERENCES public.character_story_progress(id) ON DELETE CASCADE,
            
            CONSTRAINT fk_ability
              FOREIGN KEY(ability_id) 
              REFERENCES public.${ABILITIES_TABLE}(id) ON DELETE CASCADE,
            
            CONSTRAINT uq_char_story_ability UNIQUE (character_story_progress_id, ability_id)
          );
          
          CREATE INDEX IF NOT EXISTS idx_${CHAR_STORY_ABILITIES_TABLE}_progress_id ON public.${CHAR_STORY_ABILITIES_TABLE} (character_story_progress_id);
          CREATE INDEX IF NOT EXISTS idx_${CHAR_STORY_ABILITIES_TABLE}_ability_id ON public.${CHAR_STORY_ABILITIES_TABLE} (ability_id);
          
          RAISE NOTICE 'Table ${CHAR_STORY_ABILITIES_TABLE} created.';
        ELSE
          RAISE NOTICE 'Table ${CHAR_STORY_ABILITIES_TABLE} already exists.';
        END IF;
      END $$;
    `);
    console.log(`CREATE TABLE IF NOT EXISTS for ${CHAR_STORY_ABILITIES_TABLE} executed or table already existed.`);
    
    console.log('Raw SQL migration for ability tables finished successfully.');
  } catch (error) {
    console.error('Error during raw SQL migration for ability tables:', error);
    throw error;
  }
};

/** @param { import("knex").Knex } knex */
exports.down = async function(knex) {
  console.log('Attempting to roll back ability tables using RAW SQL...');
  try {
    // Fontos a sorrend: először a hivatkozó táblát (character_story_abilities),
    // aztán azt, amire hivatkoztak (abilities).
    await knex.raw(`DROP TABLE IF EXISTS public.${CHAR_STORY_ABILITIES_TABLE} CASCADE;`);
    console.log(`Table ${CHAR_STORY_ABILITIES_TABLE} dropped.`);
    
    await knex.raw(`DROP TABLE IF EXISTS public.${ABILITIES_TABLE} CASCADE;`);
    console.log(`Table ${ABILITIES_TABLE} dropped.`);
    
    console.log('Finished rolling back ability tables.');
  } catch (error) {
    console.error('Error during raw SQL rollback for ability tables:', error);
    throw error;
  }
};