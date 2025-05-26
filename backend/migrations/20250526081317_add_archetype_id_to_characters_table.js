// backend/migrations/YYYYMMDDHHMMSS_add_archetype_id_to_characters_table.js
const CHARACTERS_TABLE = 'characters';
const ARCHETYPES_TABLE = 'character_archetypes';
const COLUMN_NAME = 'selected_archetype_id';
const FK_CONSTRAINT_NAME = `fk_${CHARACTERS_TABLE}_${COLUMN_NAME}`;

/** @param { import("knex").Knex } knex */
exports.up = async function(knex) {
  console.log(`Attempting to add ${COLUMN_NAME} column to ${CHARACTERS_TABLE}...`);
  try {
    await knex.schema.alterTable(CHARACTERS_TABLE, (table) => {
      // Oszlop hozzáadása, ha még nem létezik
      // A Knex alterTable nem támogatja az IF NOT EXISTS-t az addColumn-ra,
      // ezért a hasColumn ellenőrzés jobb, vagy nyers SQL.
      // Most egyszerűen hozzáadjuk, a nyers SQL lenne az igazán idempotens.
      table.integer(COLUMN_NAME).nullable().unsigned(); // unsigned, ha az ID-k mindig pozitívak
      table.foreign(COLUMN_NAME, FK_CONSTRAINT_NAME)
           .references('id')
           .inTable(ARCHETYPES_TABLE)
           .onDelete('SET NULL'); // Ha egy archetípus törlődik, a karakteren ez null lesz
    });
    console.log(`Column ${COLUMN_NAME} and its FK constraint added to ${CHARACTERS_TABLE}.`);
  } catch (error) {
    console.error(`Error adding column ${COLUMN_NAME} to ${CHARACTERS_TABLE}:`, error);
    // Ha az oszlop már létezik, itt elkaphatjuk a hibát, de a migrációnak le kellene futnia
    // A `table.foreign` dobhat hibát, ha az oszlop már létezik és próbálja újra hozzáadni.
    // Egy robosztusabb megoldás nyers SQL-t használna IF NOT EXISTS feltételekkel.
    // Egyelőre feltételezzük, hogy tiszta a helyzet.
    throw error;
  }
};

/** @param { import("knex").Knex } knex */
exports.down = async function(knex) {
  console.log(`Attempting to remove ${COLUMN_NAME} column from ${CHARACTERS_TABLE}...`);
  try {
    await knex.schema.alterTable(CHARACTERS_TABLE, (table) => {
      table.dropForeign(COLUMN_NAME, FK_CONSTRAINT_NAME); // Előbb a constraint
      table.dropColumn(COLUMN_NAME);
    });
    console.log(`Column ${COLUMN_NAME} and its FK constraint removed from ${CHARACTERS_TABLE}.`);
  } catch (error) {
    console.error(`Error removing column ${COLUMN_NAME} from ${CHARACTERS_TABLE}:`, error);
    throw error;
  }
};