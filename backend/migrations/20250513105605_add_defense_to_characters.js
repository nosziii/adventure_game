// backend/migrations/YYYYMMDDHHMMSS_add_defense_to_characters.js
const TABLE_NAME = 'characters';
const COLUMN_NAME = 'defense';

/** @param { import("knex").Knex } knex */
exports.up = async function(knex) {
  console.log(`Attempting to add ${COLUMN_NAME} column to ${TABLE_NAME} using RAW SQL...`);
  try {
    await knex.raw(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = '<span class="math-inline">\{TABLE\_NAME\}' AND column\_name \= '</span>{COLUMN_NAME}') THEN
          ALTER TABLE public.${TABLE_NAME} ADD COLUMN ${COLUMN_NAME} INTEGER NOT NULL DEFAULT 0;
          RAISE NOTICE 'Column <span class="math-inline">\{TABLE\_NAME\}\.</span>{COLUMN_NAME} added.';
        ELSE
          RAISE NOTICE 'Column <span class="math-inline">\{TABLE\_NAME\}\.</span>{COLUMN_NAME} already exists.';
        END IF;
      END $$;
    `);
    console.log(`Raw SQL migration for ${COLUMN_NAME} column finished.`);
  } catch (error) {
    console.error(`Error during raw SQL migration for ${COLUMN_NAME} column:`, error);
    throw error;
  }
};

/** @param { import("knex").Knex } knex */
exports.down = async function(knex) {
  console.log(`Attempting to remove ${COLUMN_NAME} column from ${TABLE_NAME} using RAW SQL...`);
  try {
    await knex.raw(`ALTER TABLE public.${TABLE_NAME} DROP COLUMN IF EXISTS ${COLUMN_NAME};`);
    console.log(`Finished removing ${COLUMN_NAME} column.`);
  } catch (error) {
    console.error(`Error during raw SQL rollback for ${COLUMN_NAME} column:`, error);
    throw error;
  }
};