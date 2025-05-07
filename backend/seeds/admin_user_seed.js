// backend/seeds/admin_user_seed.js
const bcrypt = require('bcryptjs'); // Vagy bcrypt

/** @param { import("knex").Knex } knex */
exports.seed = async function(knex) {
  const adminEmail = 'admin@kalandjatek.hu'; // Vagy amit szeretnél
  const adminPassword = 'aA12345678';
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);

  // Ellenőrizzük, létezik-e már
  const existingAdmin = await knex('users').where({ email: adminEmail }).first();

  if (!existingAdmin) {
    console.log(`Inserting admin user: ${adminEmail}`);
    await knex('users').insert({
      email: adminEmail,
      password_hash: hashedPassword,
      role: 'admin' // <-- Itt adjuk meg az admin szerepkört
    });
  } else {
     // Opcionális: Frissíthetjük a meglévőt, hogy biztosan admin legyen
     console.log(`Admin user ${adminEmail} already exists. Ensuring role is admin.`);
     await knex('users').where({ email: adminEmail }).update({ role: 'admin' });
  }
};