// backend/migrations/YYYYMMDDHHMMSS_add_equipped_cols_raw.js

/** @param { import("knex").Knex } knex */
exports.up = async function(knex) {
  console.log('Attempting to add equipped columns to characters using RAW SQL...');
  try {
    // equipped_weapon_id hozzáadása, ha nem létezik
    await knex.raw(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'characters' AND column_name = 'equipped_weapon_id') THEN
          ALTER TABLE public.characters ADD COLUMN equipped_weapon_id INTEGER NULL;
          -- Foreign key constraint (lehet külön is)
          ALTER TABLE public.characters ADD CONSTRAINT characters_equipped_weapon_id_fk FOREIGN KEY (equipped_weapon_id) REFERENCES public.items(id) ON DELETE SET NULL;
          -- Index létrehozása (ha még nincs)
          CREATE INDEX IF NOT EXISTS characters_equipped_weapon_id_index ON public.characters (equipped_weapon_id);
          RAISE NOTICE 'Column characters.equipped_weapon_id added.';
        ELSE
          RAISE NOTICE 'Column characters.equipped_weapon_id already exists.';
        END IF;
      END $$;
    `);

    // equipped_armor_id hozzáadása, ha nem létezik
    await knex.raw(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'characters' AND column_name = 'equipped_armor_id') THEN
          ALTER TABLE public.characters ADD COLUMN equipped_armor_id INTEGER NULL;
          -- Foreign key constraint
          ALTER TABLE public.characters ADD CONSTRAINT characters_equipped_armor_id_fk FOREIGN KEY (equipped_armor_id) REFERENCES public.items(id) ON DELETE SET NULL;
          -- Index létrehozása
          CREATE INDEX IF NOT EXISTS characters_equipped_armor_id_index ON public.characters (equipped_armor_id);
          RAISE NOTICE 'Column characters.equipped_armor_id added.';
        ELSE
          RAISE NOTICE 'Column characters.equipped_armor_id already exists.';
        END IF;
      END $$;
    `);
    console.log('Raw SQL migration for equipped columns finished.');
  } catch (error) {
    console.error('Error during raw SQL migration for equipped columns:', error);
    throw error;
  }
};

/** @param { import("knex").Knex } knex */
exports.down = async function(knex) {
  console.log('Attempting to remove equipped columns from characters using RAW SQL...');
  try {
    // A constraint-eket és indexeket érdemes lehet külön törölni, de a DROP COLUMN általában viszi őket PostgreSQL-ben
    await knex.raw(`ALTER TABLE public.characters DROP COLUMN IF EXISTS equipped_armor_id;`);
    await knex.raw(`ALTER TABLE public.characters DROP COLUMN IF EXISTS equipped_weapon_id;`);
    console.log('Finished removing equipped columns.');
  } catch (error) {
     console.error('Error during raw SQL rollback for equipped columns:', error);
     throw error;
  }
};