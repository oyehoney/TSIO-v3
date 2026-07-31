'use strict';
const knex = require('knex');

let db;

function getDb() {
  if (!db) {
    db = knex({
      client: 'pg',
      connection: process.env.DATABASE_URL,
      pool: { min: 2, max: 10 },
    });
  }
  return db;
}

module.exports = { getDb };
