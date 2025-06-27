/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
exports.up = async function (knex) {
  console.log(
    'Adding "role" column to "characters" table if it does not exist...',
  );
  await knex.raw(`
    ALTER TABLE public.characters
    ADD COLUMN IF NOT EXISTS role VARCHAR(255);
  `);
};

/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
exports.down = async function (knex) {
  console.log('Dropping "role" column from "characters" table if it exists...');
  await knex.raw(`
    ALTER TABLE public.characters
    DROP COLUMN IF EXISTS role;
  `);
};
