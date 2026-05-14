# 🚀 IMMEDIATE ACTION STEPS

## RIGHT NOW (5 min)

### 1. Fill in Your Password
Edit `backend/.env` and replace the password:

**BEFORE:**
```
DATABASE_URL=postgresql://neondb_owner:YOUR_PASSWORD_HERE@...
```

**AFTER:**
```
DATABASE_URL=postgresql://neondb_owner:YOUR_ACTUAL_PASSWORD@...
```

---

### 2. Create Database Tables
Go to: https://console.neon.tech

1. Open SQL Editor
2. Copy entire contents of `backend/schema-postgres.sql` 
3. Paste & Execute

**OR** run in terminal:
```bash
psql "postgresql://neondb_owner:YOUR_PASSWORD@ep-dawn-shape-aqtbgrba.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require" < backend/schema-postgres.sql
```

---

### 3. Test Database Connection
```bash
cd backend
npm install pg
npm run dev
```

✅ Should see: `✅ PostgreSQL connected: [timestamp]`

---

## NEXT STEPS (if connection works)

### 4. Update All Controllers
Search for `result.` in controllers and replace with `result.rows.`

Files to update:
- `backend/src/controllers/authController.js`
- `backend/src/controllers/campaignController.js`
- `backend/src/controllers/donationController.js`
- `backend/src/controllers/expenseController.js`
- `backend/src/controllers/fraudController.js`
- `backend/src/controllers/ngoController.js`

**Example change:**
```javascript
// BEFORE (MySQL)
const users = result;

// AFTER (PostgreSQL)
const users = result.rows;
```

---

### 5. Test Locally
```bash
npm run dev
# Test API endpoints
```

---

### 6. Deploy to Vercel
```bash
git add .
git commit -m "Migrate to PostgreSQL"
git push origin main

# Deploy frontend
cd frontend
vercel --prod

# Deploy backend
cd ..
vercel --prod
```

---

## DOCUMENTATION

- **Full guide:** See `NEON_SETUP.md`
- **Deployment guide:** See `VERCEL_DEPLOYMENT.md`
- **Quick reference:** See `DEPLOY_QUICK_START.md`

---

## FILES READY TO USE

- ✅ `backend/.env` - Database connection configured
- ✅ `backend/config/db.js` - PostgreSQL driver configured
- ✅ `backend/schema-postgres.sql` - Ready to import
- ✅ `backend/config/db-postgres.js` - Reference config

---

## NEED HELP?

Check for errors:
```bash
npm run dev
```

Look at console output - it will tell you what's wrong.

