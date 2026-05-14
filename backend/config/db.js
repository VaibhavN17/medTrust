const { Pool } = require('pg');

// Use PostgreSQL with Neon (serverless Postgres)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' 
    ? { rejectUnauthorized: false }
    : false,
  max: 5, // Connection pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('❌ Database connection error:', err.message);
});

// Test connection
pool.query('SELECT NOW()', (err, result) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    console.error('Check DATABASE_URL in .env file');
  } else {
    console.log('✅ PostgreSQL connected:', result.rows[0].now);
  }
});

module.exports = pool;
