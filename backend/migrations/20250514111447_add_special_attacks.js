// backend/migrations/YYYYMMDDHHMMSS_add_special_attacks.js

const ENEMIES_TABLE = 'enemies';
const ACTIVE_COMBATS_TABLE = 'active_combats';

/** @param { import("knex").Knex } knex */
exports.up = async function(knex) {
  console.log(`Attempting to modify ${ENEMIES_TABLE} and ${ACTIVE_COMBATS_TABLE} using RAW SQL...`);
  try {
    // Oszlopok hozzáadása az 'enemies' táblához
    await knex.raw(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = '${ENEMIES_TABLE}' AND column_name = 'special_attack_name') THEN
          ALTER TABLE public.${ENEMIES_TABLE} ADD COLUMN special_attack_name VARCHAR(255) NULL;
          RAISE NOTICE 'Column ${ENEMIES_TABLE}.special_attack_name added.';
        ELSE
          RAISE NOTICE 'Column ${ENEMIES_TABLE}.special_attack_name already exists.';
        END IF;

        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = '${ENEMIES_TABLE}' AND column_name = 'special_attack_damage_multiplier') THEN
          ALTER TABLE public.${ENEMIES_TABLE} ADD COLUMN special_attack_damage_multiplier FLOAT NULL DEFAULT 1.0;
          RAISE NOTICE 'Column ${ENEMIES_TABLE}.special_attack_damage_multiplier added.';
        ELSE
          RAISE NOTICE 'Column ${ENEMIES_TABLE}.special_attack_damage_multiplier already exists.';
        END IF;

        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = '${ENEMIES_TABLE}' AND column_name = 'special_attack_charge_turns') THEN
          ALTER TABLE public.${ENEMIES_TABLE} ADD COLUMN special_attack_charge_turns INTEGER NULL DEFAULT 0;
          RAISE NOTICE 'Column ${ENEMIES_TABLE}.special_attack_charge_turns added.';
        ELSE
          RAISE NOTICE 'Column ${ENEMIES_TABLE}.special_attack_charge_turns already exists.';
        END IF;

        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = '${ENEMIES_TABLE}' AND column_name = 'special_attack_telegraph_text') THEN
          ALTER TABLE public.${ENEMIES_TABLE} ADD COLUMN special_attack_telegraph_text TEXT NULL;
          RAISE NOTICE 'Column ${ENEMIES_TABLE}.special_attack_telegraph_text added.';
        ELSE
          RAISE NOTICE 'Column ${ENEMIES_TABLE}.special_attack_telegraph_text already exists.';
        END IF;

        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = '${ENEMIES_TABLE}' AND column_name = 'special_attack_execute_text') THEN
          ALTER TABLE public.${ENEMIES_TABLE} ADD COLUMN special_attack_execute_text TEXT NULL;
          RAISE NOTICE 'Column ${ENEMIES_TABLE}.special_attack_execute_text added.';
        ELSE
          RAISE NOTICE 'Column ${ENEMIES_TABLE}.special_attack_execute_text already exists.';
        END IF;
      END $$;
    `);
    console.log(`Columns for special attacks potentially added/verified for ${ENEMIES_TABLE}.`);

    // Oszlop hozzáadása az 'active_combats' táblához
    await knex.raw(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = '${ACTIVE_COMBATS_TABLE}' AND column_name = 'enemy_charge_turns_current') THEN
          ALTER TABLE public.${ACTIVE_COMBATS_TABLE} ADD COLUMN enemy_charge_turns_current INTEGER NOT NULL DEFAULT 0;
          RAISE NOTICE 'Column ${ACTIVE_COMBATS_TABLE}.enemy_charge_turns_current added.';
        ELSE
          RAISE NOTICE 'Column ${ACTIVE_COMBATS_TABLE}.enemy_charge_turns_current already exists.';
        END IF;
      END $$;
    `);
    console.log(`Column for charge turns potentially added/verified for ${ACTIVE_COMBATS_TABLE}.`);

  } catch (error) {
    console.error('Error during raw SQL migration for special attacks:', error);
    throw error;
  }
};

/** @param { import("knex").Knex } knex */
exports.down = async function(knex) {
  console.log(`Attempting to remove special attack columns using RAW SQL...`);
  try {
    await knex.raw(`
      ALTER TABLE public.${ENEMIES_TABLE}
      DROP COLUMN IF EXISTS special_attack_name,
      DROP COLUMN IF EXISTS special_attack_damage_multiplier,
      DROP COLUMN IF EXISTS special_attack_charge_turns,
      DROP COLUMN IF EXISTS special_attack_telegraph_text,
      DROP COLUMN IF EXISTS special_attack_execute_text;
    `);
    await knex.raw(`
      ALTER TABLE public.${ACTIVE_COMBATS_TABLE}
      DROP COLUMN IF EXISTS enemy_charge_turns_current;
    `);
    console.log('Finished removing special attack columns.');
  } catch (error) {
    console.error('Error during raw SQL rollback for special attack columns:', error);
    throw error;
  }
};