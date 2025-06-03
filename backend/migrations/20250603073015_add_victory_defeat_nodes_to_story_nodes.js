// backend/migrations/YYYYMMDDHHMMSS_add_victory_defeat_nodes_to_story_nodes.js

const TABLE_NAME = 'story_nodes';
const VICTORY_COLUMN = 'victory_node_id';
const DEFEAT_COLUMN = 'defeat_node_id';
const FK_VICTORY_CONSTRAINT_NAME = `fk_${TABLE_NAME}_${VICTORY_COLUMN}`;
const FK_DEFEAT_CONSTRAINT_NAME = `fk_${TABLE_NAME}_${DEFEAT_COLUMN}`;

/** @param { import("knex").Knex } knex */
exports.up = async function(knex) {
  console.log(`Attempting to add ${VICTORY_COLUMN} and ${DEFEAT_COLUMN} columns with constraints to ${TABLE_NAME}...`);
  try {
    // Add victory_node_id column
    await knex.raw(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = '${TABLE_NAME}' AND column_name = '${VICTORY_COLUMN}') THEN
          ALTER TABLE public.${TABLE_NAME} ADD COLUMN ${VICTORY_COLUMN} INTEGER NULL;
          RAISE NOTICE 'Column ${TABLE_NAME}.${VICTORY_COLUMN} added.';
        ELSE
          RAISE NOTICE 'Column ${TABLE_NAME}.${VICTORY_COLUMN} already exists.';
        END IF;
      END $$;
    `);
    console.log(`Column ${VICTORY_COLUMN} ensured in ${TABLE_NAME}.`);

    // Add defeat_node_id column
    await knex.raw(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = '${TABLE_NAME}' AND column_name = '${DEFEAT_COLUMN}') THEN
          ALTER TABLE public.${TABLE_NAME} ADD COLUMN ${DEFEAT_COLUMN} INTEGER NULL;
          RAISE NOTICE 'Column ${TABLE_NAME}.${DEFEAT_COLUMN} added.';
        ELSE
          RAISE NOTICE 'Column ${TABLE_NAME}.${DEFEAT_COLUMN} already exists.';
        END IF;
      END $$;
    `);
    console.log(`Column ${DEFEAT_COLUMN} ensured in ${TABLE_NAME}.`);

    // Add Foreign Key for victory_node_id
    await knex.raw(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '${FK_VICTORY_CONSTRAINT_NAME}') THEN
          ALTER TABLE public.${TABLE_NAME}
          ADD CONSTRAINT ${FK_VICTORY_CONSTRAINT_NAME}
          FOREIGN KEY (${VICTORY_COLUMN}) REFERENCES public.story_nodes(id) ON DELETE SET NULL;
          RAISE NOTICE 'Constraint ${FK_VICTORY_CONSTRAINT_NAME} added to ${TABLE_NAME}.';
        ELSE
          RAISE NOTICE 'Constraint ${FK_VICTORY_CONSTRAINT_NAME} on ${TABLE_NAME} already exists.';
        END IF;
      END $$;
    `);
    console.log(`Constraint ${FK_VICTORY_CONSTRAINT_NAME} ensured for ${TABLE_NAME}.`);

    // Add Foreign Key for defeat_node_id
    await knex.raw(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '${FK_DEFEAT_CONSTRAINT_NAME}') THEN
          ALTER TABLE public.${TABLE_NAME}
          ADD CONSTRAINT ${FK_DEFEAT_CONSTRAINT_NAME}
          FOREIGN KEY (${DEFEAT_COLUMN}) REFERENCES public.story_nodes(id) ON DELETE SET NULL;
          RAISE NOTICE 'Constraint ${FK_DEFEAT_CONSTRAINT_NAME} added to ${TABLE_NAME}.';
        ELSE
          RAISE NOTICE 'Constraint ${FK_DEFEAT_CONSTRAINT_NAME} on ${TABLE_NAME} already exists.';
        END IF;
      END $$;
    `);
    console.log(`Constraint ${FK_DEFEAT_CONSTRAINT_NAME} ensured for ${TABLE_NAME}.`);

    console.log(`Raw SQL migration for new columns in ${TABLE_NAME} finished successfully.`);
  } catch (error) {
    console.error(`Error adding columns to ${TABLE_NAME}:`, error);
    throw error;
  }
};

/** @param { import("knex").Knex } knex */
exports.down = async function(knex) {
  console.log(`Attempting to remove ${VICTORY_COLUMN} and ${DEFEAT_COLUMN} columns from ${TABLE_NAME}...`);
  try {
    // A constraint-ek explicit törlése név alapján, mielőtt az oszlopot törölnénk
    await knex.raw(`
      ALTER TABLE public.${TABLE_NAME}
      DROP CONSTRAINT IF EXISTS ${FK_VICTORY_CONSTRAINT_NAME};
    `);
    console.log(`Constraint ${FK_VICTORY_CONSTRAINT_NAME} dropped if existed.`);
    
    await knex.raw(`
      ALTER TABLE public.${TABLE_NAME}
      DROP CONSTRAINT IF EXISTS ${FK_DEFEAT_CONSTRAINT_NAME};
    `);
    console.log(`Constraint ${FK_DEFEAT_CONSTRAINT_NAME} dropped if existed.`);

    // Oszlopok törlése
    await knex.raw(`
      ALTER TABLE public.${TABLE_NAME}
      DROP COLUMN IF EXISTS ${VICTORY_COLUMN},
      DROP COLUMN IF EXISTS ${DEFEAT_COLUMN};
    `);
    console.log(`Finished removing ${VICTORY_COLUMN} and ${DEFEAT_COLUMN} columns from ${TABLE_NAME}.`);
  } catch (error) {
    console.error(`Error removing columns from ${TABLE_NAME}:`, error);
    throw error;
  }
};