# Vercel Deployment Guide - MedTrust

## Cost-Effective Hosting Strategy

### Architecture
- **Frontend**: Vercel Next.js (Free tier + Pro $20/month for production)
- **Backend**: Vercel Serverless Functions (Free tier limited)
- **Database**: Neon PostgreSQL or PlanetScale MySQL (Free tier available)

---

## Prerequisites

1. **Vercel Account**: https://vercel.com (free)
2. **Database**: Choose one:
   - **Neon PostgreSQL** (Recommended): https://neon.tech (free tier: 0.5 GB, good for dev/small prod)
   - **PlanetScale MySQL**: https://planetscale.com (free tier: 5 GB)

---

## Step 1: Setup Database (Free)

### Option A: Neon PostgreSQL (RECOMMENDED)

1. Go to https://neon.tech and sign up
2. Create a new project
3. Copy your connection string (looks like: `postgresql://user:password@host/database`)
4. Save for later (Step 4)

### Option B: PlanetScale MySQL

1. Go to https://planetscale.com and sign up
2. Create a new database
3. Click "Connect" → "Passwords" → Create password
4. Copy connection string
5. Save for later

---

## Step 2: Update Backend Structure

Convert Express server to Vercel serverless functions:

```bash
# Create API directory
mkdir -p api
```

Backend will use `/api` routes automatically on Vercel.

---

## Step 3: Database Migration

Replace MySQL with PostgreSQL (Neon):

```bash
# Install PostgreSQL driver
npm install pg
npm install --save-dev knex
```

Update `backend/config/db.js`:
```javascript
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

module.exports = pool;
```

---

## Step 4: Deploy to Vercel

### Frontend Deployment

```bash
cd frontend
npm install -g vercel
vercel
```

Follow prompts:
- Link to existing project or create new
- Select framework: Next.js
- Set `NEXT_PUBLIC_API_URL` to your backend URL (after deploying backend)

### Backend Deployment

1. **Push to GitHub** (required for Vercel):
```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

2. **Import to Vercel**:
   - Visit https://vercel.com/new
   - Import your GitHub repository
   - Select "Backend" folder if using monorepo

3. **Set Environment Variables** in Vercel Dashboard:
   - `DATABASE_URL`: Your Neon/PlanetScale connection string
   - `JWT_SECRET`: Your JWT secret
   - `CLIENT_URL`: Your frontend Vercel URL
   - `AWS_ACCESS_KEY_ID`: Your AWS S3 key
   - `AWS_SECRET_ACCESS_KEY`: Your AWS S3 secret
   - `S3_BUCKET_NAME`: Your S3 bucket
   - Other environment variables from `.env`

---

## Step 5: Update Frontend API Configuration

In `frontend/src/lib/api.ts`:

```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://your-backend.vercel.app';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

---

## Cost Breakdown (Monthly)

| Service | Free Tier | Pro | Notes |
|---------|-----------|-----|-------|
| **Vercel Frontend** | $0 | $20 | Includes 100k edge requests |
| **Vercel Serverless** | $0 (limited) | Included in Pro | Free: 100 invocations/day |
| **Neon Database** | $0 | $15+ | Free: 0.5 GB, good for dev |
| **Total (Free Tier)** | **$0** | - | Production-ready: $35-50/month |

---

## Limitations of Free Tier

- **100 serverless function invocations/day** (not enough for production)
- **10-second execution timeout**
- **Limited database storage**

### For Production: Upgrade to Vercel Pro ($20/month) + Database Pro ($10-15/month)

---

## Environment Variables Needed

### Backend `.env`
```
DATABASE_URL=postgresql://user:pass@host/dbname
JWT_SECRET=your_secret_key
NODE_ENV=production
CLIENT_URL=https://your-frontend.vercel.app

# AWS S3
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
S3_BUCKET_NAME=

# Email
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=

# Payment
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
```

### Frontend `.env.local`
```
NEXT_PUBLIC_API_URL=https://your-backend.vercel.app
```

---

## Alternative: Keep Backend on Railway (Recommended for Production)

For better reliability and cost, consider:

1. **Frontend**: Vercel (Free tier)
2. **Backend**: Railway.app ($5/month starter)
3. **Database**: Railway PostgreSQL ($5/month)

**Total: ~$10/month for production-grade hosting**

---

## Quick Deploy Checklist

- [ ] Create Neon/PlanetScale account
- [ ] Update database driver in backend
- [ ] Push code to GitHub
- [ ] Import frontend to Vercel
- [ ] Import backend to Vercel
- [ ] Set all environment variables
- [ ] Test API endpoints
- [ ] Update frontend API URL

---

## Support & Docs

- Vercel Docs: https://vercel.com/docs
- Neon Docs: https://neon.tech/docs
- Serverless Functions: https://vercel.com/docs/concepts/functions/serverless-functions

