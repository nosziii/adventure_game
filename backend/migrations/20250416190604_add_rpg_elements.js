// backend/migrations/YYYYMMDDHHMMSS_add_rpg_elements.js - ÚJ, ROBUSTUS UP FÜGGVÉNY

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
    // --- Új táblák létrehozása (createTableIfNotExists a biztonság kedvéért) ---
    if (!(await knex.schema.hasTable('items'))) {
      await knex.schema.createTable('items', (table) => {
        table.increments('id').primary();
        table.string('name').notNullable().unique();
        table.text('description');
        table.string('type').notNullable().index();
        table.string('effect').nullable();
        table.boolean('usable').defaultTo(false);
        table.timestamps(true, true);
      });
      console.log('Created table: items');
    } else {
      console.log('Table already exists: items');
    }
  
    if (!(await knex.schema.hasTable('enemies'))) {
      await knex.schema.createTable('enemies', (table) => {
        table.increments('id').primary();
        table.string('name').notNullable();
        table.integer('health').notNullable();
        table.integer('skill').notNullable();
        table.string('attack_description').nullable();
        table.text('defeat_text').nullable();
        table.integer('item_drop_id').unsigned().nullable()
             .references('id').inTable('items').onDelete('SET NULL');
        table.timestamps(true, true);
      });
      console.log('Created table: enemies');
    } else {
      console.log('Table already exists: enemies');
    }
  
    // A character_inventory függ az items és characters tábláktól,
    // ezért ellenőrizzük azokat is, mielőtt létrehoznánk
    const itemsExists = await knex.schema.hasTable('items');
    const charactersExists = await knex.schema.hasTable('characters');
    if (itemsExists && charactersExists && !(await knex.schema.hasTable('character_inventory'))) {
      await knex.schema.createTable('character_inventory', (table) => {
        table.integer('character_id').unsigned().notNullable()
             .references('id').inTable('characters').onDelete('CASCADE');
        table.integer('item_id').unsigned().notNullable()
             .references('id').inTable('items').onDelete('CASCADE');
        table.integer('quantity').unsigned().notNullable().defaultTo(1);
        table.timestamps(true, true);
        table.primary(['character_id', 'item_id']);
      });
      console.log('Created table: character_inventory');
    } else if (await knex.schema.hasTable('character_inventory')) {
         console.log('Table already exists: character_inventory');
    } else {
        console.log('Skipping character_inventory creation: items or characters table missing.');
    }

  
    console.log('Migration up completed for add_rpg_elements.');
  };
  
  /**
   * @param { import("knex").Knex } knex
   * @returns { Promise<void> }
   */
  exports.down = async function(knex) {
  
    // 4. Új táblák törlése
    await knex.schema.dropTableIfExists('character_inventory')
    await knex.schema.dropTableIfExists('enemies')
    await knex.schema.dropTableIfExists('items')
  }