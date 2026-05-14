// backend/config/db-postgres.js
// PostgreSQL configuration for Vercel deployment
// Use this instead of mysql2 for Neon/PlanetScale with PostgreSQL

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' 
    ? { rejectUnauthorized: false }
    : false,
  max: 5, // Connection pool size (important for serverless)
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

// Test connection
pool.query('SELECT NOW()', (err, result) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
  } else {
    console.log('✅ Database connected:', result.rows[0]);
  }
});

module.exports = pool;

/*
MIGRATION GUIDE: MySQL → PostgreSQL

1. Install PostgreSQL driver:
   npm install pg

2. Update backend/config/db.js to use this file

3. Convert SQL queries to PostgreSQL syntax:
   - MySQL: SELECT * FROM users LIMIT 1, 10
   - PostgreSQL: SELECT * FROM users LIMIT 10 OFFSET 1
   
   - MySQL: INSERT INTO users (...) VALUES (...); SELECT LAST_INSERT_ID()
   - PostgreSQL: INSERT INTO users (...) VALUES (...) RETURNING id

4. Update schema.sql:
   - AUTO_INCREMENT → SERIAL
   - DATETIME → TIMESTAMP
   - BOOLEAN (MySQL has no native boolean) → BOOLEAN

Example schema conversion:

MySQL:
  CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

PostgreSQL:
  CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

5. Connection string format:
   postgresql://username:password@host:5432/database_name
   
   Example from Neon:
   postgresql://neondb_owner:password@ep-xxxxx.neon.tech/neondb?sslmode=require
*/

