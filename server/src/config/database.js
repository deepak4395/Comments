const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'comments_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Test the connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  console.error('This usually means a database connection was lost');
  console.error('The pool will attempt to reconnect automatically');
  // The pool handles reconnection automatically, so we just log the error
});

// Verify database connection on startup
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err);
    console.error('Make sure PostgreSQL is running and credentials are correct');
  } else {
    console.log('Database connection verified at:', res.rows[0].now);
  }
});

module.exports = pool;
