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

    // Split SQL into individual statements and run sequentially so we can
    // ignore objects that already exist and make this script idempotent.
    const statements = sql
      .split(/;\s*(?=\n|$)/m)
      .map(s => s.trim())
      .filter(Boolean);

    for (const stmt of statements) {
      try {
        await client.query(stmt);
      } catch (err) {
        const msg = (err.message || '').toString();
        // Ignore common "already exists" errors so re-running is safe
        if (/already exists|duplicate key|exists/i.test(msg)) {
          console.log('Skipping existing object:', msg.split('\n')[0]);
          continue;
        }
        throw err;
      }
    }

    console.log('Schema applied successfully.');
  } catch (err) {
    console.error('Error applying schema:', err.message || err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
})();
