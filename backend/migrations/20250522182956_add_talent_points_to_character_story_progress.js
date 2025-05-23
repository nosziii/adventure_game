// backend/migrations/YYYYMMDDHHMMSS_add_talent_points_to_character_story_progress.js
const TABLE_NAME = 'character_story_progress';
const COLUMN_NAME = 'talent_points_available';

/** @param { import("knex").Knex } knex */
exports.up = async function(knex) {
  console.log(`Attempting to add ${COLUMN_NAME} column to ${TABLE_NAME}...`);
  try {
    await knex.schema.alterTable(TABLE_NAME, (table) => {
      // Csak akkor adjuk hozzá, ha még nem létezik (bár az alterTable nem dob hibát, ha már van)
      // De a biztonság kedvéért a hasColumn jobb lenne, vagy raw SQL IF NOT EXISTS
      table.integer(COLUMN_NAME).notNullable().defaultTo(0);
    });
    // Nyers SQL verzió, ami biztosan idempotens:
    // await knex.raw(`
    //   DO $$
    //   BEGIN
    //     IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = '<span class="math-inline">\{TABLE\_NAME\}' AND column\_name \= '</span>{COLUMN_NAME}') THEN
    //       ALTER TABLE public.${TABLE_NAME} ADD COLUMN ${COLUMN_NAME} INTEGER NOT NULL DEFAULT 0;
    //       RAISE NOTICE 'Column <span class="math-inline">\{TABLE\_NAME\}\.</span>{COLUMN_NAME} added.';
    //     ELSE
    //       RAISE NOTICE 'Column <span class="math-inline">\{TABLE\_NAME\}\.</span>{COLUMN_NAME} already exists.';
    //     END IF;
    //   END $$;
    // `);
    console.log(`Column ${COLUMN_NAME} added to ${TABLE_NAME} (or already existed).`);
  } catch (error) {
    console.error(`Error adding column ${COLUMN_NAME} to ${TABLE_NAME}:`, error);
    throw error;
  }
};

/** @param { import("knex").Knex } knex */
exports.down = async function(knex) {
  console.log(`Attempting to remove ${COLUMN_NAME} column from ${TABLE_NAME}...`);
  try {
    await knex.schema.alterTable(TABLE_NAME, (table) => {
      table.dropColumn(COLUMN_NAME);
    });
    console.log(`Column ${COLUMN_NAME} removed from ${TABLE_NAME}.`);
  } catch (error) {
    console.error(`Error removing column ${COLUMN_NAME} from ${TABLE_NAME}:`, error);
    throw error;
  }
};