// backend/migrations/YYYYMMDDHHMMSS_remove_archetype_id_from_characters.js
const TABLE_NAME = 'characters';
const COLUMN_NAME = 'selected_archetype_id';
const FK_CONSTRAINT_NAME = `fk_${TABLE_NAME}_${COLUMN_NAME}`; // Ahogy a #167-ben nevezted

exports.up = async function (knex) {
  await knex.schema.alterTable(TABLE_NAME, (table) => {
    // Előbb a constraint törlése, ha létezik és nevesítettük
    // Ha nem nevesítetted, a dropForeign bonyolultabb lehet, vagy a dropColumn viszi
    try {
      table.dropForeign(COLUMN_NAME, FK_CONSTRAINT_NAME);
    } catch (e) {
      console.log(
        'FK constraint for selected_archetype_id might not exist or name differs, skipping drop.',
      );
    }
    table.dropColumn(COLUMN_NAME);
  });
  console.log(`Column ${COLUMN_NAME} removed from ${TABLE_NAME}.`);
};
exports.down = async function (knex) {
  // Visszaállítás, ha kell
  await knex.schema.alterTable(TABLE_NAME, (table) => {
    table.integer(COLUMN_NAME).nullable().unsigned();
    table
      .foreign(COLUMN_NAME, FK_CONSTRAINT_NAME)
      .references('id')
      .inTable('character_archetypes')
      .onDelete('SET NULL');
  });
};
