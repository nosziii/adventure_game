// backend/migrations/YYYYMMDDHHMMSS_add_allowed_archetypes_to_abilities.js
const ABILITIES_TABLE = 'abilities';
const COLUMN_NAME = 'allowed_archetype_ids';

/** @param { import("knex").Knex } knex */
exports.up = async function (knex) {
  console.log(
    `Attempting to add ${COLUMN_NAME} column to ${ABILITIES_TABLE} using RAW SQL...`,
  );
  try {
    await knex.raw(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' AND table_name = '<span class="math-inline">\{ABILITIES\_TABLE\}' AND column\_name \= '</span>{COLUMN_NAME}'
        ) THEN
          ALTER TABLE public.${ABILITIES_TABLE} ADD COLUMN ${COLUMN_NAME} JSONB NULL;
          RAISE NOTICE 'Column <span class="math-inline">\{ABILITIES\_TABLE\}\.</span>{COLUMN_NAME} added.';
        ELSE
          RAISE NOTICE 'Column <span class="math-inline">\{ABILITIES\_TABLE\}\.</span>{COLUMN_NAME} already exists.';
        END IF;
      END $$;
    `);
    console.log(
      `Raw SQL migration for ${COLUMN_NAME} column in ${ABILITIES_TABLE} finished successfully.`,
    );
  } catch (error) {
    console.error(
      `Error adding column ${COLUMN_NAME} to ${ABILITIES_TABLE}:`,
      error,
    );
    throw error;
  }
};

/** @param { import("knex").Knex } knex */
exports.down = async function (knex) {
  console.log(
    `Attempting to remove ${COLUMN_NAME} column from ${ABILITIES_TABLE} using RAW SQL...`,
  );
  try {
    await knex.raw(`
      ALTER TABLE public.${ABILITIES_TABLE} DROP COLUMN IF EXISTS ${COLUMN_NAME};
    `);
    console.log(
      `Finished removing ${COLUMN_NAME} column from ${ABILITIES_TABLE}.`,
    );
  } catch (error) {
    console.error(
      `Error removing column ${COLUMN_NAME} from ${ABILITIES_TABLE}:`,
      error,
    );
    throw error;
  }
};
