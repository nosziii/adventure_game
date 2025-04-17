
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
    // Users tábla [spec: 95]
    await knex.schema.createTable('users', (table) => {
      table.increments('id').primary(); // Elsődleges kulcs
      table.string('email', 255).notNullable().unique(); // Email (vagy username), egyedi
      table.string('password_hash').notNullable(); // Hashelt jelszó
      table.timestamp('created_at').defaultTo(knex.fn.now()); // Létrehozás ideje
      table.timestamp('updated_at').defaultTo(knex.fn.now()); // Utolsó módosítás ideje
    });
  
    // Story Nodes tábla [spec: 108, 110, 111]
    await knex.schema.createTable('story_nodes', (table) => {
      table.increments('id').primary();
      table.integer('story_id').nullable(); // Ha több történet lenne (opcionális MVP-ben)
      table.text('text').notNullable(); // A jelenet szövege
      table.string('image').nullable(); // Opcionális kép URL
      table.boolean('is_end').defaultTo(false); // Befejező csomópont?
      table.integer('health_effect').nullable(); // Életerő változás (pl. csapda)
      // Későbbi foreign key mezők (most csak sima integer)
      table.integer('item_reward_id').nullable();
      table.integer('enemy_id').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
  
    // Choices tábla [spec: 113, 114, 115]
    await knex.schema.createTable('choices', (table) => {
      table.increments('id').primary();
      table.integer('source_node_id').unsigned().notNullable()
           .references('id').inTable('story_nodes').onDelete('RESTRICT'); // Melyik csomópontból indul (RESTRICT: ne lehessen törölni a node-ot, ha choice hivatkozik rá)
      table.integer('target_node_id').unsigned().notNullable()
           .references('id').inTable('story_nodes').onDelete('RESTRICT'); // Melyik csomópontba vezet
      table.string('text').notNullable(); // A választás szövege
      // Későbbi foreign key vagy feltételes mezők
      table.integer('required_item_id').nullable();
      table.string('required_stat_check').nullable(); // Pl. "skill >= 10"
      table.string('visible_only_if').nullable(); // Megjelenítési feltétel
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
  
      // Indexek a gyorsabb kereséshez a foreign keyeken
      table.index('source_node_id');
      table.index('target_node_id');
    });
  
    // Characters tábla [spec: 97, 98, 99]
    await knex.schema.createTable('characters', (table) => {
      table.increments('id').primary();
      table.integer('user_id').unsigned().notNullable().unique() // Egy user = egy karakter (MVP)
           .references('id').inTable('users').onDelete('CASCADE'); // Ha törlődik a user, törlődjön a karakter is
      table.string('name').nullable(); // Karakter neve
      table.integer('health').notNullable().defaultTo(100); // Kezdő életerő (példa)
      table.integer('skill').nullable().defaultTo(10); // Kezdő ügyesség (példa)
      // ...további statisztikák ide...
      table.integer('current_node_id').unsigned().nullable() // Hol tart a karakter a történetben
           .references('id').inTable('story_nodes').onDelete('SET NULL'); // Ha a node törlődik, a karakter node_id-je NULL lesz
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
  
      table.index('user_id');
      table.index('current_node_id');
    });
  };
  
  /**
   * @param { import("knex").Knex } knex
   * @returns { Promise<void> }
   */
  exports.down = async function(knex) {
    // A táblákat fordított sorrendben kell törölni a függőségek miatt!
    await knex.schema.dropTableIfExists('characters');
    await knex.schema.dropTableIfExists('choices');
    await knex.schema.dropTableIfExists('story_nodes');
    await knex.schema.dropTableIfExists('users');
  };