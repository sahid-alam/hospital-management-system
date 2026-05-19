const { Pool } = require('pg');

const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME     || 'hospital_mgmt',
  user:     process.env.DB_USER     || process.env.USER,
  password: process.env.DB_PASSWORD || undefined,
});

pool.on('error', (err) => console.error('DB pool error:', err));

module.exports = pool;
