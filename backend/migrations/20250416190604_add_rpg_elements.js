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
  
  
    // --- Meglévő táblák módosítása: oszlopok hozzáadása, ha még nem léteznek ---
  
    // story_nodes módosítása
    await knex.schema.alterTable('story_nodes', async (table) => {
        if (!(await knex.schema.hasColumn('story_nodes', 'enemy_id'))) {
            table.integer('enemy_id').unsigned().nullable().references('id').inTable('enemies').onDelete('SET NULL');
            table.index('enemy_id'); // Indexet is csak akkor, ha létrehoztuk
            console.log('Added column: story_nodes.enemy_id');
        } else { console.log('Column already exists: story_nodes.enemy_id'); }
  
        if (!(await knex.schema.hasColumn('story_nodes', 'item_reward_id'))) {
            table.integer('item_reward_id').unsigned().nullable().references('id').inTable('items').onDelete('SET NULL');
            table.index('item_reward_id');
            console.log('Added column: story_nodes.item_reward_id');
        } else { console.log('Column already exists: story_nodes.item_reward_id'); }
        // A health_effect-et feltételezzük, hogy létezik egy korábbi migrációból
    });
  
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
        // A required_stat_check-et feltételezzük, hogy létezik
    });
  
     // characters módosítása
    await knex.schema.alterTable('characters', async (table) => {
        if (!(await knex.schema.hasColumn('characters', 'luck'))) {
            table.integer('luck').nullable().defaultTo(5);
            console.log('Added column: characters.luck');
        } else { console.log('Column already exists: characters.luck'); }
  
        if (!(await knex.schema.hasColumn('characters', 'stamina'))) {
            table.integer('stamina').nullable().defaultTo(100);
            console.log('Added column: characters.stamina');
        } else { console.log('Column already exists: characters.stamina'); }
        // A skillt feltételezzük, hogy létezik
    });
  
    console.log('Migration up completed for add_rpg_elements.');
  };
  
  /**
   * @param { import("knex").Knex } knex
   * @returns { Promise<void> }
   */
  exports.down = async function(knex) {
    // Visszavonás fordított sorrendben + constraint-ek törlése először
  
    // 1. Characters tábla módosításainak visszavonása
    await knex.schema.alterTable('characters', (table) => {
      table.dropColumn('stamina');
      table.dropColumn('luck');
      // A skill és health maradjon
    });
  
    // 2. Choices tábla módosításainak visszavonása
     await knex.schema.alterTable('choices', (table) => {
      // Előbb a külföldi kulcs constraint-et kell törölni, ha van
      // table.dropForeign('item_cost_id'); // Knex nem mindig követeli meg expliciten, de biztonságosabb
      // table.dropForeign('required_item_id');
      table.dropColumn('item_cost_id');
      table.dropColumn('required_item_id');
     });
  
    // 3. Story Nodes tábla módosításainak visszavonása
     await knex.schema.alterTable('story_nodes', (table) => {
      // table.dropForeign('item_reward_id');
      // table.dropForeign('enemy_id');
      table.dropColumn('item_reward_id');
      table.dropColumn('enemy_id');
     });
  
    // 4. Új táblák törlése
    await knex.schema.dropTableIfExists('character_inventory')
    await knex.schema.dropTableIfExists('enemies')
    await knex.schema.dropTableIfExists('items')
  }