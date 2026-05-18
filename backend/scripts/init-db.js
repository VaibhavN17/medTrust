const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const DATABASE_URL = process.env.DATABASE_URL || process.env.PG_CONNECTION || '';
if (!DATABASE_URL) {
  console.error('Missing DATABASE_URL in environment. Set it in backend/.env or export it.');
  process.exit(1);
}

const schemaPath = path.resolve(__dirname, '..', 'schema-postgres.sql');
if (!fs.existsSync(schemaPath)) {
  console.error('schema-postgres.sql not found at', schemaPath);
  process.exit(1);
}

const sql = fs.readFileSync(schemaPath, 'utf8');

(async () => {
  const client = new Client({ connectionString: DATABASE_URL });
  try {
    await client.connect();
    console.log('Connected to database, executing schema...');
    await client.query(sql);
    console.log('Schema applied successfully.');
  } catch (err) {
    console.error('Error applying schema:', err.message || err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
})();
