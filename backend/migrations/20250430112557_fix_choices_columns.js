// backend/migrations/YYYYMMDDHHMMSS_fix_choices_columns.js

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // choices módosítása
  await knex.schema.alterTable('choices', async (table) => {
      if (!(await knex.schema.hasColumn('choices', 'required_item_id'))) {
          table.integer('required_item_id').unsigned().nullable().references('id').inTable('items').onDelete('SET NULL');
          table.index('required_item_id');
          console.log('Added column: choices.required_item_id');
      } else { console.log('Column already exists: choices.required_item_id'); }

      if (!(await knex.schema.hasColumn('choices', 'item_cost_id'))) {
           table.integer('item_cost_id').unsigned().nullable().references('id').inTable('items').onDelete('SET NULL');
           table.index('item_cost_id');
           console.log('Added column: choices.item_cost_id');
       } else { console.log('Column already exists: choices.item_cost_id'); }
  });
  console.log('Migration up completed for fix_choices_columns.');
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  // Csak ennek a migrációnak a visszavonása
  await knex.schema.alterTable('choices', (table) => {
      // Előbb indexek törlése (biztonságosabb lehet)
      // table.dropIndex('item_cost_id');
      // table.dropIndex('required_item_id');
      // A dropForeign nem feltétlenül kell, a dropColumn általában viszi
      table.dropColumn('item_cost_id');
      table.dropColumn('required_item_id');
  });
  console.log('Migration down completed for fix_choices_columns.');
};