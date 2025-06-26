// backend/migrations/YYYYMMDDHHMMSS_add_role_to_users.js - EGYSZERŰSÍTETT UP

/** @param { import("knex").Knex } knex */
exports.up = async function(knex) {
  console.log('Attempting to add role column to CHARACTERS table...');
  // Itt a 'users' átírva 'characters'-re!
  await knex.schema.table('characters', function(table) {
    table.string('role'); 
  });
  console.log('Finished adding role column to CHARACTERS table.');
};

/** @param { import("knex").Knex } knex */
exports.down = async function(knex) {
  console.log('Attempting to remove role column from CHARACTERS table...');
  // Itt is a 'users' átírva 'characters'-re!
  await knex.schema.table('characters', function(table) {
    table.dropColumn('role');
  });
  console.log('Finished removing role column from CHARACTERS table.');
};