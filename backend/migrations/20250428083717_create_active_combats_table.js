// Készítette: [Zsolt]
// Leírás: Aktív harcok táblája, amely tárolja a karakterek és ellenfelek közötti harcokat.
// A táblázat tartalmazza a harc kezdési idejét, az utolsó akció idejét, és a karakterek és ellenfelek aktuális HP-ját.
// A táblázat célja, hogy nyomon kövesse a harcokat és azok állapotát.
// A táblázat neve: active_combats
// A táblázat oszlopai:
// - id: egyedi azonosító (elsődleges kulcs)
// - character_id: a harcban részt vevő karakter azonosítója (külső kulcs a characters táblára)
// - enemy_id: a harcban részt vevő ellenfél azonosítója (külső kulcs az enemies táblára)
// - enemy_current_health: az ellenfél aktuális HP-ja
// - combat_start_time: a harc kezdési ideje
// - last_action_time: az utolsó akció ideje
// - created_at: a rekord létrehozásának ideje
// - updated_at: a rekord utolsó frissítésének ideje
// - index: index a character_id oszlopra a gyors keresés érdekében
// - foreign key: a character_id és enemy_id oszlopok külső kulcsok a characters és enemies táblákra
// - onDelete: CASCADE, ha a karakter vagy ellenfél törlődik, a harc is törlődik
// - unique: a character_id oszlop egyedi, így egy karakter csak egy harcban lehet
// - unsigned: a character_id és enemy_id oszlopok csak pozitív egész számokat tartalmazhatnak
// - notNullable: a character_id, enemy_id és enemy_current_health oszlopok nem lehetnek nullák
// - defaultTo: a combat_start_time és last_action_time oszlopok alapértelmezett értéke a jelenlegi idő
// - timestamps: a created_at és updated_at oszlopok automatikusan frissülnek a rekord létrehozásakor és frissítésekor
// - table: a táblázat neve
// - knex: a Knex.js könyvtár, amely lehetővé teszi az adatbázis műveletek végrehajtását
// - schema: a Knex.js könyvtár része, amely lehetővé teszi az adatbázis séma kezelését
// - hasTable: ellenőrzi, hogy létezik-e a megadott nevű táblázat
// - createTable: létrehozza a megadott nevű táblázatot
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
    // Közvetlenül megpróbáljuk létrehozni a táblát
    await knex.schema.createTable('active_combats', (table) => {
      table.increments('id').primary();
      table.integer('character_id').unsigned().notNullable().unique()
           .references('id').inTable('characters').onDelete('CASCADE');
      table.integer('enemy_id').unsigned().notNullable()
           .references('id').inTable('enemies').onDelete('CASCADE');
      table.integer('enemy_current_health').notNullable();
      table.timestamp('combat_start_time').defaultTo(knex.fn.now());
      table.timestamp('last_action_time').defaultTo(knex.fn.now());
      table.timestamps(true, true);
      table.index('character_id');
    });
    console.log('Attempted to create table: active_combats');
  };
  
  /**
   * @param { import("knex").Knex } knex
   * @returns { Promise<void> }
   */
  // A down függvény maradhat az eredeti dropTableIfExists-szel
  exports.down = async function(knex) {
    await knex.schema.dropTableIfExists('active_combats');
    console.log('Attempted to drop table: active_combats');
  };