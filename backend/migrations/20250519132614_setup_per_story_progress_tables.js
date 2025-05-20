// backend/migrations/YYYYMMDDHHMMSS_setup_per_story_progress_tables.js

const CSP_TABLE_NAME = 'character_story_progress';
const CSI_TABLE_NAME = 'character_story_inventory';
const PP_TABLE_NAME = 'player_progress';

/** @param { import("knex").Knex } knex */
exports.up = async function(knex) {
  console.log(`Starting migration to set up per-story progress tables...`);

  try {
    // --- 1. Character Story Progress tábla ---
    console.log(`Attempting to create ${CSP_TABLE_NAME} table...`);
    await knex.raw(`
      CREATE TABLE IF NOT EXISTS public.${CSP_TABLE_NAME} (
        id SERIAL PRIMARY KEY,
        character_id INTEGER NOT NULL,
        story_id INTEGER NOT NULL,
        current_node_id INTEGER NULL,
        health INTEGER NOT NULL DEFAULT 100,
        skill INTEGER NOT NULL DEFAULT 10,
        luck INTEGER NOT NULL DEFAULT 5,
        stamina INTEGER NOT NULL DEFAULT 100,
        defense INTEGER NOT NULL DEFAULT 0,
        level INTEGER NOT NULL DEFAULT 1,
        xp INTEGER NOT NULL DEFAULT 0,
        xp_to_next_level INTEGER NOT NULL DEFAULT 100,
        equipped_weapon_id INTEGER NULL,
        equipped_armor_id INTEGER NULL,
        last_played_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log(`CREATE TABLE IF NOT EXISTS for ${CSP_TABLE_NAME} executed.`);

    // Constraints for character_story_progress (külön, hogy az IF NOT EXISTS egyszerűbb legyen a CREATE TABLE-nél)
    console.log(`Attempting to add constraints to ${CSP_TABLE_NAME}...`);
    await knex.raw(`
      DO $$
      BEGIN
        -- Foreign Key: character_id
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_${CSP_TABLE_NAME}_character_id') THEN
          ALTER TABLE public.${CSP_TABLE_NAME}
          ADD CONSTRAINT fk_${CSP_TABLE_NAME}_character_id
          FOREIGN KEY(character_id) REFERENCES public.characters(id) ON DELETE CASCADE;
          RAISE NOTICE 'Constraint fk_${CSP_TABLE_NAME}_character_id added.';
        ELSE RAISE NOTICE 'Constraint fk_${CSP_TABLE_NAME}_character_id already exists.'; END IF;

        -- Foreign Key: story_id
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_${CSP_TABLE_NAME}_story_id') THEN
          ALTER TABLE public.${CSP_TABLE_NAME}
          ADD CONSTRAINT fk_${CSP_TABLE_NAME}_story_id
          FOREIGN KEY(story_id) REFERENCES public.stories(id) ON DELETE CASCADE;
          RAISE NOTICE 'Constraint fk_${CSP_TABLE_NAME}_story_id added.';
        ELSE RAISE NOTICE 'Constraint fk_${CSP_TABLE_NAME}_story_id already exists.'; END IF;

        -- Foreign Key: current_node_id
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_${CSP_TABLE_NAME}_current_node_id') THEN
          ALTER TABLE public.${CSP_TABLE_NAME}
          ADD CONSTRAINT fk_${CSP_TABLE_NAME}_current_node_id
          FOREIGN KEY(current_node_id) REFERENCES public.story_nodes(id) ON DELETE SET NULL;
          RAISE NOTICE 'Constraint fk_${CSP_TABLE_NAME}_current_node_id added.';
        ELSE RAISE NOTICE 'Constraint fk_${CSP_TABLE_NAME}_current_node_id already exists.'; END IF;
        
        -- Foreign Key: equipped_weapon_id
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_${CSP_TABLE_NAME}_equipped_weapon_id') THEN
          ALTER TABLE public.${CSP_TABLE_NAME}
          ADD CONSTRAINT fk_${CSP_TABLE_NAME}_equipped_weapon_id
          FOREIGN KEY(equipped_weapon_id) REFERENCES public.items(id) ON DELETE SET NULL;
          RAISE NOTICE 'Constraint fk_${CSP_TABLE_NAME}_equipped_weapon_id added.';
        ELSE RAISE NOTICE 'Constraint fk_${CSP_TABLE_NAME}_equipped_weapon_id already exists.'; END IF;

        -- Foreign Key: equipped_armor_id
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_${CSP_TABLE_NAME}_equipped_armor_id') THEN
          ALTER TABLE public.${CSP_TABLE_NAME}
          ADD CONSTRAINT fk_${CSP_TABLE_NAME}_equipped_armor_id
          FOREIGN KEY(equipped_armor_id) REFERENCES public.items(id) ON DELETE SET NULL;
          RAISE NOTICE 'Constraint fk_${CSP_TABLE_NAME}_equipped_armor_id added.';
        ELSE RAISE NOTICE 'Constraint fk_${CSP_TABLE_NAME}_equipped_armor_id already exists.'; END IF;

        -- Unique constraint: character_id, story_id
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_${CSP_TABLE_NAME}_character_story') THEN
          ALTER TABLE public.${CSP_TABLE_NAME}
          ADD CONSTRAINT uq_${CSP_TABLE_NAME}_character_story UNIQUE (character_id, story_id);
          RAISE NOTICE 'Constraint uq_${CSP_TABLE_NAME}_character_story added.';
        ELSE RAISE NOTICE 'Constraint uq_${CSP_TABLE_NAME}_character_story already exists.'; END IF;
      END $$;
    `);
    console.log(`Constraints for ${CSP_TABLE_NAME} ensured.`);

    // Indexek for character_story_progress
    await knex.raw(`CREATE INDEX IF NOT EXISTS idx_${CSP_TABLE_NAME}_character_id ON public.${CSP_TABLE_NAME} (character_id);`);
    await knex.raw(`CREATE INDEX IF NOT EXISTS idx_${CSP_TABLE_NAME}_story_id ON public.${CSP_TABLE_NAME} (story_id);`);
    await knex.raw(`CREATE INDEX IF NOT EXISTS idx_${CSP_TABLE_NAME}_is_active ON public.${CSP_TABLE_NAME} (character_id, is_active);`);
    console.log(`Indexes for ${CSP_TABLE_NAME} ensured.`);

    // --- 2. Character Story Inventory tábla ---
    console.log(`Attempting to create ${CSI_TABLE_NAME} table...`);
    await knex.raw(`
      CREATE TABLE IF NOT EXISTS public.${CSI_TABLE_NAME} (
        id SERIAL PRIMARY KEY,
        character_story_progress_id INTEGER NOT NULL,
        item_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log(`CREATE TABLE IF NOT EXISTS for ${CSI_TABLE_NAME} executed.`);

    // Constraints for character_story_inventory
    console.log(`Attempting to add constraints to ${CSI_TABLE_NAME}...`);
    await knex.raw(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_${CSI_TABLE_NAME}_progress_id') THEN
          ALTER TABLE public.${CSI_TABLE_NAME}
          ADD CONSTRAINT fk_${CSI_TABLE_NAME}_progress_id
          FOREIGN KEY(character_story_progress_id) REFERENCES public.${CSP_TABLE_NAME}(id) ON DELETE CASCADE;
          RAISE NOTICE 'Constraint fk_${CSI_TABLE_NAME}_progress_id added.';
        ELSE RAISE NOTICE 'Constraint fk_${CSI_TABLE_NAME}_progress_id already exists.'; END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_${CSI_TABLE_NAME}_item_id') THEN
          ALTER TABLE public.${CSI_TABLE_NAME}
          ADD CONSTRAINT fk_${CSI_TABLE_NAME}_item_id
          FOREIGN KEY(item_id) REFERENCES public.items(id) ON DELETE CASCADE;
          RAISE NOTICE 'Constraint fk_${CSI_TABLE_NAME}_item_id added.';
        ELSE RAISE NOTICE 'Constraint fk_${CSI_TABLE_NAME}_item_id already exists.'; END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_${CSI_TABLE_NAME}_progress_item') THEN
          ALTER TABLE public.${CSI_TABLE_NAME}
          ADD CONSTRAINT uq_${CSI_TABLE_NAME}_progress_item UNIQUE (character_story_progress_id, item_id);
          RAISE NOTICE 'Constraint uq_${CSI_TABLE_NAME}_progress_item added.';
        ELSE RAISE NOTICE 'Constraint uq_${CSI_TABLE_NAME}_progress_item already exists.'; END IF;
      END $$;
    `);
    console.log(`Constraints for ${CSI_TABLE_NAME} ensured.`);
    
    // Indexek for character_story_inventory
    await knex.raw(`CREATE INDEX IF NOT EXISTS idx_${CSI_TABLE_NAME}_progress_id ON public.${CSI_TABLE_NAME} (character_story_progress_id);`);
    console.log(`Index idx_${CSI_TABLE_NAME}_progress_id ensured.`);

    // --- 3. Player Progress tábla ÚJRAÉPÍTÉSE ---
    console.log(`Recreating ${PP_TABLE_NAME} table for per-story progress...`);
    await knex.raw(`DROP TABLE IF EXISTS public.${PP_TABLE_NAME} CASCADE;`); // Először töröljük, ha létezik
    await knex.raw(`
      CREATE TABLE public.${PP_TABLE_NAME} (
        id SERIAL PRIMARY KEY,
        character_story_progress_id INTEGER NOT NULL,
        node_id INTEGER NOT NULL,
        choice_id_taken INTEGER NULL,
        visited_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log(`CREATE TABLE for ${PP_TABLE_NAME} executed.`);

    // Constraints for player_progress
    console.log(`Attempting to add constraints to ${PP_TABLE_NAME}...`);
    await knex.raw(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_${PP_TABLE_NAME}_progress_id') THEN
          ALTER TABLE public.${PP_TABLE_NAME}
          ADD CONSTRAINT fk_${PP_TABLE_NAME}_progress_id
          FOREIGN KEY(character_story_progress_id) REFERENCES public.${CSP_TABLE_NAME}(id) ON DELETE CASCADE;
          RAISE NOTICE 'Constraint fk_${PP_TABLE_NAME}_progress_id added.';
        ELSE RAISE NOTICE 'Constraint fk_${PP_TABLE_NAME}_progress_id already exists.'; END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_${PP_TABLE_NAME}_node_id') THEN
          ALTER TABLE public.${PP_TABLE_NAME}
          ADD CONSTRAINT fk_${PP_TABLE_NAME}_node_id
          FOREIGN KEY(node_id) REFERENCES public.story_nodes(id) ON DELETE CASCADE;
          RAISE NOTICE 'Constraint fk_${PP_TABLE_NAME}_node_id added.';
        ELSE RAISE NOTICE 'Constraint fk_${PP_TABLE_NAME}_node_id already exists.'; END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_${PP_TABLE_NAME}_choice_id_taken') THEN
          ALTER TABLE public.${PP_TABLE_NAME}
          ADD CONSTRAINT fk_${PP_TABLE_NAME}_choice_id_taken
          FOREIGN KEY(choice_id_taken) REFERENCES public.choices(id) ON DELETE SET NULL;
          RAISE NOTICE 'Constraint fk_${PP_TABLE_NAME}_choice_id_taken added.';
        ELSE RAISE NOTICE 'Constraint fk_${PP_TABLE_NAME}_choice_id_taken already exists.'; END IF;
      END $$;
    `);
    console.log(`Constraints for ${PP_TABLE_NAME} ensured.`);

    // Indexek for player_progress
    await knex.raw(`CREATE INDEX IF NOT EXISTS idx_${PP_TABLE_NAME}_progress_id ON public.${PP_TABLE_NAME} (character_story_progress_id);`);
    console.log(`Index idx_${PP_TABLE_NAME}_progress_id ensured.`);

    console.log('Per-story progress tables setup migration finished successfully.');
  } catch (error) {
    console.error('Error during per-story progress tables setup migration:', error);
    throw error;
  }
};

/** @param { import("knex").Knex } knex */
exports.down = async function(knex) {
  console.log('Rolling back per-story progress tables setup...');
  try {
    await knex.raw(`DROP TABLE IF EXISTS public.${PP_TABLE_NAME} CASCADE;`);
    await knex.raw(`DROP TABLE IF EXISTS public.${CSI_TABLE_NAME} CASCADE;`);
    await knex.raw(`DROP TABLE IF EXISTS public.${CSP_TABLE_NAME} CASCADE;`);
    console.log('Finished rolling back per-story progress tables.');
    // Ha a player_progress-t vissza akarod állítani az eredeti, character_id-s verzióra,
    // akkor itt azt a CREATE TABLE parancsot kellene futtatni.
    // De a legtöbb esetben a down csak törli, amit az up létrehozott.
  } catch (error) {
    console.error('Error during rollback of per-story progress tables:', error);
    throw error;
  }
};