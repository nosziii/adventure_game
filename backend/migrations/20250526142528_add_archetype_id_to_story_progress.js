// backend/migrations/YYYYMMDDHHMMSS_add_archetype_id_to_story_progress.js
const TABLE_NAME = 'character_story_progress';
const COLUMN_NAME = 'selected_archetype_id';
const FK_CONSTRAINT_NAME = `fk_${TABLE_NAME}_${COLUMN_NAME}`;

exports.up = async function (knex) {
  await knex.schema.alterTable(TABLE_NAME, (table) => {
    table.integer(COLUMN_NAME).nullable().unsigned();
    table
      .foreign(COLUMN_NAME, FK_CONSTRAINT_NAME)
      .references('id')
      .inTable('character_archetypes')
      .onDelete('SET NULL'); // Ha az archetípus törlődik, ez null lesz
  });
  console.log(`Column ${COLUMN_NAME} and FK added to ${TABLE_NAME}.`);
};
exports.down = async function (knex) {
  await knex.schema.alterTable(TABLE_NAME, (table) => {
    table.dropForeign(COLUMN_NAME, FK_CONSTRAINT_NAME);
    table.dropColumn(COLUMN_NAME);
  });
};
