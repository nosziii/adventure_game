// backend/migrations/YYYYMMDDHHMMSS_add_xp_reward_to_enemies.js

/** @param { import("knex").Knex } knex */
exports.up = async function(knex) {
  console.log('Attempting to add xp_reward column to enemies using RAW SQL...');
  try {
    await knex.raw(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'enemies' AND column_name = 'xp_reward') THEN
          ALTER TABLE public.enemies ADD COLUMN xp_reward INTEGER NOT NULL DEFAULT 0;
          RAISE NOTICE 'Column enemies.xp_reward added.';
        ELSE
          RAISE NOTICE 'Column enemies.xp_reward already exists.';
        END IF;
      END $$;
    `);
    console.log('Raw SQL migration for xp_reward column finished.');
  } catch (error) {
    console.error('Error during raw SQL migration for xp_reward column:', error);
    throw error;
  }
};

/** @param { import("knex").Knex } knex */
exports.down = async function(knex) {
   console.log('Attempting to remove xp_reward column from enemies using RAW SQL...');
   try {
    await knex.raw(`ALTER TABLE public.enemies DROP COLUMN IF EXISTS xp_reward;`);
     console.log('Finished removing xp_reward column.');
   } catch (error) {
     console.error('Error during raw SQL rollback for xp_reward column:', error);
     throw error;
   }
};