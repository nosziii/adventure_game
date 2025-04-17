require('dotenv').config({ path: '../.env' }); // .env betöltése a gyökérből

module.exports = {
  development: {
    client: 'pg',
    connection: process.env.DATABASE_URL, // .env fájlból olvassa
    migrations: {
      directory: './migrations'
    },
    seeds: {
      directory: './seeds'
    }
  },
  // Production környezethez is lehet külön beállítás
  // production: { ... }
}