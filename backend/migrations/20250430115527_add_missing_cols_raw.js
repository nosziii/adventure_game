// backend/migrations/YYYYMMDDHHMMSS_add_missing_cols_raw.js
/** @param { import("knex").Knex } knex */
exports.up = async function(knex) {
  console.log('Attempting to add missing columns using RAW SQL...');
  try {
    // Add columns to choices if they don't exist
    await knex.raw(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'choices' AND column_name = 'required_item_id') THEN
          ALTER TABLE public.choices ADD COLUMN required_item_id INTEGER NULL;
          ALTER TABLE public.choices ADD CONSTRAINT choices_required_item_id_fk FOREIGN KEY (required_item_id) REFERENCES public.items(id) ON DELETE SET NULL;
          CREATE INDEX choices_required_item_id_index ON public.choices (required_item_id);
          RAISE NOTICE 'Column choices.required_item_id added.';
        ELSE
          RAISE NOTICE 'Column choices.required_item_id already exists.';
        END IF;
      END $$;
    `);
     await knex.raw(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'choices' AND column_name = 'item_cost_id') THEN
          ALTER TABLE public.choices ADD COLUMN item_cost_id INTEGER NULL;
          ALTER TABLE public.choices ADD CONSTRAINT choices_item_cost_id_fk FOREIGN KEY (item_cost_id) REFERENCES public.items(id) ON DELETE SET NULL;
          CREATE INDEX choices_item_cost_id_index ON public.choices (item_cost_id);
           RAISE NOTICE 'Column choices.item_cost_id added.';
        ELSE
          RAISE NOTICE 'Column choices.item_cost_id already exists.';
        END IF;
      END $$;
    `);

     // Add columns to characters if they don't exist
     await knex.raw(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'characters' AND column_name = 'luck') THEN
           ALTER TABLE public.characters ADD COLUMN luck INTEGER NULL DEFAULT 5;
           RAISE NOTICE 'Column characters.luck added.';
        ELSE
          RAISE NOTICE 'Column characters.luck already exists.';
        END IF;
      END $$;
    `);
     await knex.raw(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'characters' AND column_name = 'stamina') THEN
           ALTER TABLE public.characters ADD COLUMN stamina INTEGER NULL DEFAULT 100;
           RAISE NOTICE 'Column characters.stamina added.';
        ELSE
          RAISE NOTICE 'Column characters.stamina already exists.';
        END IF;
      END $$;
    `);
     console.log('Raw SQL migration finished.');
  } catch (error) {
    console.error('Error during raw SQL migration:', error);
    throw error; // Re-throw error to fail the migration
  }
};

/** @param { import("knex").Knex } knex */
exports.down = async function(knex) {
  // A visszavonás egyszerűbb lehet
  await knex.schema.alterTable('choices', table => {
      table.dropColumn('item_cost_id');
      table.dropColumn('required_item_id');
  });
   await knex.schema.alterTable('characters', table => {
      table.dropColumn('stamina');
      table.dropColumn('luck');
  });
   console.log('Attempted to rollback raw SQL migration.');
};