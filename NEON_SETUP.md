# Neon PostgreSQL Setup Guide

## Your Neon Credentials

```
Host:          ep-dawn-shape-aqtbgrba.c-8.us-east-1.aws.neon.tech
Database:      neondb
Role:          neondb_owner
Password:      [You have this - copy from Neon dashboard]
Pooler Host:   ep-dawn-shape-aqtbgrba-pooler.c-8.us-east-1.aws.neon.tech (use for Vercel)
```

---

## Step 1: Update Your .env File

Open `backend/.env` and find this line:

```
DATABASE_URL=postgresql://neondb_owner:YOUR_PASSWORD_HERE@ep-dawn-shape-aqtbgrba-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require
```

Replace `YOUR_PASSWORD_HERE` with your actual Neon password from the credentials above.

**Example:**
```
DATABASE_URL=postgresql://neondb_owner:mySecurePassword123@ep-dawn-shape-aqtbgrba-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require
```

---

## Step 2: Run PostgreSQL Schema

### Option A: Using Neon Web Console (Easiest)

1. Go to https://console.neon.tech
2. Select your project
3. Click "SQL Editor"
4. Copy entire contents of `backend/schema-postgres.sql`
5. Paste into the SQL editor
6. Click "Execute"

### Option B: Using Command Line

```bash
# Install PostgreSQL client (if not already installed)
# macOS: brew install postgresql
# Ubuntu: sudo apt-get install postgresql-client
# Windows: https://www.postgresql.org/download/windows/

# Run schema
psql "postgresql://neondb_owner:YOUR_PASSWORD_HERE@ep-dawn-shape-aqtbgrba.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require" < backend/schema-postgres.sql
```

---

## Step 3: Verify Database Connection

1. Update `backend/package.json`:
```bash
cd backend
npm install pg
```

2. Test connection:
```bash
npm run dev
```

You should see:
```
✅ PostgreSQL connected: [timestamp]
```

---

## Step 4: Update Database Calls in Controllers

Your backend currently uses MySQL. Convert SQL queries:

### MySQL → PostgreSQL Syntax

**INSERT and get ID:**
```javascript
// MySQL
db.query('INSERT INTO users (...) VALUES (...)', (err, result) => {
  const userId = result.insertId;
});

// PostgreSQL
db.query('INSERT INTO users (...) VALUES (...) RETURNING id', (err, result) => {
  const userId = result.rows[0].id;
});
```

**SELECT:**
```javascript
// MySQL
db.query('SELECT * FROM campaigns LIMIT 10 OFFSET 5', (err, result) => {
  const campaigns = result;
});

// PostgreSQL
db.query('SELECT * FROM campaigns LIMIT 10 OFFSET 5', (err, result) => {
  const campaigns = result.rows;
});
```

**Execute query:**
```javascript
// MySQL
db.query('INSERT INTO donations (...) VALUES (...)', (err, result) => {
  if (err) console.error(err);
  else console.log('Success');
});

// PostgreSQL (same)
db.query('INSERT INTO donations (...) VALUES (...)', (err, result) => {
  if (err) console.error(err);
  else console.log('Success');
});
```

### Key Differences:

| Operation | MySQL | PostgreSQL |
|-----------|-------|-----------|
| Get inserted ID | `result.insertId` | `result.rows[0].id` (use RETURNING) |
| Get query results | `result` (array) | `result.rows` (array) |
| Pagination | `LIMIT 10 OFFSET 5` | `LIMIT 10 OFFSET 5` (same) |
| Auto-increment | `AUTO_INCREMENT` | `SERIAL` |
| Update timestamp | `ON UPDATE CURRENT_TIMESTAMP` | Requires trigger (skip for now) |

---

## Step 5: Test Individual Controllers

### Test Auth Controller

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

---

## Step 6: Update Frontend API URL

In `frontend/src/lib/api.ts`:

```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
```

Create `frontend/.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

---

## Step 7: Deploy to Vercel

Once everything works locally:

```bash
# 1. Commit changes
git add .
git commit -m "Migrate to PostgreSQL with Neon"
git push origin main

# 2. Deploy frontend
cd frontend
vercel --prod

# 3. Deploy backend
cd ../backend
vercel --prod

# 4. Set environment variables in Vercel Dashboard
# Add DATABASE_URL and other env vars
```

---

## Troubleshooting

### "ECONNREFUSED" Error
```
Error: connect ECONNREFUSED
```
**Solution:** Check DATABASE_URL in .env, verify Neon project is active.

### "Column does not exist"
**Solution:** Run schema-postgres.sql again to ensure all tables are created.

### "relation \"users\" does not exist"
**Solution:** You're missing the schema. Run the SQL file again.

### "SSL certificate problem"
**Solution:** Already handled with `sslmode=require` in connection string.

---

## Vercel Deployment - Environment Variables

In Vercel Dashboard → Settings → Environment Variables, add:

```
DATABASE_URL=postgresql://neondb_owner:PASSWORD@ep-dawn-shape-aqtbgrba-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require
JWT_SECRET=your_secret_here
CLIENT_URL=https://your-frontend.vercel.app
NEXT_PUBLIC_API_URL=https://your-backend.vercel.app
[other env vars...]
```

---

## Files Changed

- ✅ `backend/.env` - Updated with DATABASE_URL
- ✅ `backend/.env.example` - Updated with PostgreSQL format
- ✅ `backend/config/db.js` - Now uses PostgreSQL (pg driver)
- ✅ `backend/schema-postgres.sql` - PostgreSQL schema (ready to import)
- ⏳ Controllers - Need manual update for query results format

---

## Next: Update Controllers

Review these files and update query handling:
- `backend/src/controllers/authController.js`
- `backend/src/controllers/campaignController.js`
- `backend/src/controllers/donationController.js`
- `backend/src/controllers/expenseController.js`
- `backend/src/controllers/fraudController.js`
- `backend/src/controllers/ngoController.js`

Key change: Access results via `result.rows` instead of `result`.

