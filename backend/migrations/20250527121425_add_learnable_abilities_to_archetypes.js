// backend/migrations/YYYYMMDDHHMMSS_add_learnable_abilities_to_archetypes.js
const TABLE_NAME = 'character_archetypes';
const COLUMN_NAME = 'learnable_ability_ids';

/** @param { import("knex").Knex } knex */
exports.up = async function (knex) {
  console.log(
    `Attempting to add ${COLUMN_NAME} column to ${TABLE_NAME} using RAW SQL...`,
  );
  try {
    await knex.raw(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = '<span class="math-inline">\{TABLE\_NAME\}' AND column\_name \= '</span>{COLUMN_NAME}') THEN
          ALTER TABLE public.${TABLE_NAME} ADD COLUMN ${COLUMN_NAME} JSONB NULL;
          RAISE NOTICE 'Column <span class="math-inline">\{TABLE\_NAME\}\.</span>{COLUMN_NAME} added.';
        ELSE
          RAISE NOTICE 'Column <span class="math-inline">\{TABLE\_NAME\}\.</span>{COLUMN_NAME} already exists.';
        END IF;
      END $$;
    `);
    console.log(
      `Raw SQL migration for ${COLUMN_NAME} column in ${TABLE_NAME} finished successfully.`,
    );
  } catch (error) {
    console.error(
      `Error adding column ${COLUMN_NAME} to ${TABLE_NAME}:`,
      error,
    );
    throw error;
  }
};

/** @param { import("knex").Knex } knex */
exports.down = async function (knex) {
  console.log(
    `Attempting to remove ${COLUMN_NAME} column from ${TABLE_NAME}...`,
  );
  try {
    await knex.raw(`
      ALTER TABLE public.${TABLE_NAME} DROP COLUMN IF EXISTS ${COLUMN_NAME};
    `);
    console.log(`Column ${COLUMN_NAME} removed from ${TABLE_NAME}.`);
  } catch (error) {
    console.error(
      `Error removing column ${COLUMN_NAME} from ${TABLE_NAME}:`,
      error,
    );
    throw error;
  }
};
