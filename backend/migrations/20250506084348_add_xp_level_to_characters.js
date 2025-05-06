// backend/migrations/YYYYMMDDHHMMSS_add_xp_level_to_characters.js

/** @param { import("knex").Knex } knex */
exports.up = async function(knex) {
  console.log('Attempting to add level, xp, xp_to_next_level columns to characters using RAW SQL...');
  try {
    // level oszlop hozzáadása, ha nem létezik
    await knex.raw(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'characters' AND column_name = 'level') THEN
          ALTER TABLE public.characters ADD COLUMN level INTEGER NOT NULL DEFAULT 1;
          RAISE NOTICE 'Column characters.level added.';
        ELSE
          RAISE NOTICE 'Column characters.level already exists.';
        END IF;
      END $$;
    `);

    // xp oszlop hozzáadása, ha nem létezik
    await knex.raw(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'characters' AND column_name = 'xp') THEN
          ALTER TABLE public.characters ADD COLUMN xp INTEGER NOT NULL DEFAULT 0;
          RAISE NOTICE 'Column characters.xp added.';
        ELSE
          RAISE NOTICE 'Column characters.xp already exists.';
        END IF;
      END $$;
    `);

    // xp_to_next_level oszlop hozzáadása, ha nem létezik
    await knex.raw(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'characters' AND column_name = 'xp_to_next_level') THEN
          ALTER TABLE public.characters ADD COLUMN xp_to_next_level INTEGER NOT NULL DEFAULT 100; -- Kezdő érték a 2. szinthez
          RAISE NOTICE 'Column characters.xp_to_next_level added.';
        ELSE
          RAISE NOTICE 'Column characters.xp_to_next_level already exists.';
        END IF;
      END $$;
    `);
    console.log('Raw SQL migration for level/xp columns finished.');
  } catch (error) {
    console.error('Error during raw SQL migration for level/xp columns:', error);
    throw error;
  }
};

/** @param { import("knex").Knex } knex */
exports.down = async function(knex) {
  console.log('Attempting to remove level, xp, xp_to_next_level columns from characters using RAW SQL...');
  try {
    // Használjuk a DROP COLUMN IF EXISTS-t a biztonság kedvéért
    await knex.raw(`ALTER TABLE public.characters DROP COLUMN IF EXISTS xp_to_next_level;`);
    await knex.raw(`ALTER TABLE public.characters DROP COLUMN IF EXISTS xp;`);
    await knex.raw(`ALTER TABLE public.characters DROP COLUMN IF EXISTS level;`);
    console.log('Finished removing level/xp columns.');
  } catch (error) {
     console.error('Error during raw SQL rollback for level/xp columns:', error);
     throw error;
  }
};