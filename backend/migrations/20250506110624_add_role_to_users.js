// backend/migrations/YYYYMMDDHHMMSS_add_role_to_users.js - EGYSZERŰSÍTETT UP

/** @param { import("knex").Knex } knex */

exports.up = async function (knex) {
  console.log(
    'Attempting to add role column to users using ALTER TABLE IF NOT EXISTS...',
  );

  try {
    // PostgreSQL 9.6+ támogatja az ADD COLUMN IF NOT EXISTS szintaxist

    await knex.raw(`

ALTER TABLE public.users

ADD COLUMN IF NOT EXISTS role VARCHAR(50) NOT NULL DEFAULT 'player';

`);

    console.log('Finished ALTER TABLE ADD COLUMN IF NOT EXISTS for role.');

    // Opcionális: Check constraint hozzáadása külön, ha kell

    // await knex.raw(`ALTER TABLE public.users ADD CONSTRAINT users_role_check CHECK (role IN ('player', 'admin'));`);
  } catch (error) {
    console.error('Error during raw SQL migration for role column:', error);

    throw error;
  }
};

// Az exports.down maradhat a DROP COLUMN IF EXISTS logikával

/** @param { import("knex").Knex } knex */

exports.down = async function (knex) {
  // ... (A korábbi down függvény változatlanul jó) ...

  console.log(`Attempting to remove role column from users using RAW SQL...`);

  try {
    // Constraint törlése, ha hozzáadtuk

    // await knex.raw(`ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;`);

    await knex.raw(`ALTER TABLE public.users DROP COLUMN IF EXISTS role;`);

    console.log(`Finished removing role column.`);
  } catch (error) {
    console.error(`Error during raw SQL rollback for role column:`, error);

    throw error;
  }
};
