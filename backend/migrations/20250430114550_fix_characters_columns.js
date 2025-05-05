/** @param { import("knex").Knex } knex */
exports.up = async function(knex) {
   await knex.schema.alterTable('characters', async (table) => {
      if (!(await knex.schema.hasColumn('characters', 'luck'))) {
          table.integer('luck').nullable().defaultTo(5);
          console.log('Added column: characters.luck');
      } else { console.log('Column already exists: characters.luck'); }

      if (!(await knex.schema.hasColumn('characters', 'stamina'))) {
          table.integer('stamina').nullable().defaultTo(100);
          console.log('Added column: characters.stamina');
      } else { console.log('Column already exists: characters.stamina'); }
  });
   console.log('Migration up completed for fix_characters_columns.');
};

/** @param { import("knex").Knex } knex */
exports.down = async function(knex) {
  await knex.schema.alterTable('characters', (table) => {
      table.dropColumn('stamina');
      table.dropColumn('luck');
  });
   console.log('Migration down completed for fix_characters_columns.');
};