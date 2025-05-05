/** @param { import("knex").Knex } knex */
exports.up = async function(knex) {
  await knex.schema.alterTable('story_nodes', async (table) => {
      if (!(await knex.schema.hasColumn('story_nodes', 'enemy_id'))) {
          table.integer('enemy_id').unsigned().nullable().references('id').inTable('enemies').onDelete('SET NULL');
          table.index('enemy_id');
          console.log('Added column: story_nodes.enemy_id');
      } else { console.log('Column already exists: story_nodes.enemy_id'); }

      if (!(await knex.schema.hasColumn('story_nodes', 'item_reward_id'))) {
          table.integer('item_reward_id').unsigned().nullable().references('id').inTable('items').onDelete('SET NULL');
          table.index('item_reward_id');
          console.log('Added column: story_nodes.item_reward_id');
      } else { console.log('Column already exists: story_nodes.item_reward_id'); }
  });
  console.log('Migration up completed for fix_story_nodes_columns.');
};

/** @param { import("knex").Knex } knex */
exports.down = async function(knex) {
  await knex.schema.alterTable('story_nodes', (table) => {
      table.dropColumn('item_reward_id');
      table.dropColumn('enemy_id');
      // Az indexek törlése általában nem szükséges külön, a dropColumn viszi
  });
   console.log('Migration down completed for fix_story_nodes_columns.');
};
