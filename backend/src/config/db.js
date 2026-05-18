const { Pool } = require('pg');

// Support both DATABASE_URL (Neon/production) and individual env vars (local MySQL-style)
const isDatabaseUrl = !!process.env.DATABASE_URL;

let pool;

if (isDatabaseUrl) {
  // PostgreSQL via DATABASE_URL (Neon, Vercel, etc.)
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' 
      ? { rejectUnauthorized: false }
      : false,
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
} else {
  // Fallback: PostgreSQL via individual env vars (for local development)
  pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASS || 'postgres',
    database: process.env.DB_NAME || 'medtrust',
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
}

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

// Test connection
pool.query('SELECT NOW()', (err, result) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    if (isDatabaseUrl) {
      console.error('Ensure DATABASE_URL is set in backend/.env or Vercel environment.');
    } else {
      console.error('Ensure DB_HOST, DB_USER, DB_PASS, DB_NAME are set.');
    }
  } else {
    console.log('✅ Database connected (PostgreSQL)');
  }
});

module.exports = pool;
