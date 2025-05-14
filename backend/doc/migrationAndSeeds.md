
Migrations


docker compose --profile tools run --rm migrate npx knex migrate:latest --knexfile /usr/src/app/knexfile.js


Seeds 


docker compose --profile tools run --rm migrate npx knex seed:run --knexfile /usr/src/app/knexfile.js