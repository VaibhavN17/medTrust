# MedTrust Vercel Deployment - Quick Start

## 📋 Pre-Deployment Checklist

### Phase 1: Database Setup (5-10 min)
- [ ] Sign up for Neon: https://neon.tech
- [ ] Create new project
- [ ] Copy connection string (looks like: `postgresql://user:pass@host/db`)
- [ ] Save as `DATABASE_URL` environment variable

### Phase 2: Code Preparation (15-30 min)
- [ ] Update `backend/package.json`: Add `"pg": "^8.11.0"`
- [ ] Copy `backend/config/db-postgres.js` as `backend/config/db.js`
- [ ] Update all MySQL queries to PostgreSQL syntax in controllers
- [ ] Convert `backend/schema.sql` to PostgreSQL format
- [ ] Add environment variables to `.env` files

### Phase 3: GitHub Setup (5 min)
- [ ] Initialize git: `git init` (if not already done)
- [ ] Add files: `git add .`
- [ ] Commit: `git commit -m "Prepare for Vercel deployment"`
- [ ] Push: `git push origin main`

### Phase 4: Vercel Deployment (10-15 min)

#### Deploy Frontend
```bash
cd frontend
npm install -g vercel
vercel
# Follow prompts
# Save the URL (e.g., https://medtrust-frontend.vercel.app)
```

#### Deploy Backend
```bash
# From root directory
cd ..
vercel
# Select "Backend" as root directory
# This creates: https://medtrust-backend.vercel.app
```

### Phase 5: Configure Environment Variables
In Vercel Dashboard for each deployment:

**Backend Environment Variables:**
```
DATABASE_URL=postgresql://user:pass@host/db
JWT_SECRET=your-secret-key-here
NODE_ENV=production
CLIENT_URL=https://medtrust-frontend.vercel.app

# AWS S3 (if using file uploads)
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
S3_BUCKET_NAME=your_bucket

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Razorpay (payments)
RAZORPAY_KEY_ID=your_key
RAZORPAY_KEY_SECRET=your_secret
```

**Frontend Environment Variables:**
```
NEXT_PUBLIC_API_URL=https://medtrust-backend.vercel.app
```

---

## 🚀 Deployment Commands (Step by Step)

```bash
# 1. Install dependencies (if needed)
npm install
cd frontend && npm install && cd ..
cd backend && npm install && cd ..

# 2. Test locally first
npm run dev

# 3. Push to GitHub
git add .
git commit -m "Ready for Vercel"
git push origin main

# 4. Deploy to Vercel
cd frontend
vercel --prod
# Copy the URL

cd ../backend
vercel --prod
# Copy the API URL

# 5. Go to Vercel Dashboard and set environment variables
# (See Environment Variables section above)
```

---

## 📊 Cost Estimate

| Component | Free | Pro | Recommended |
|-----------|------|-----|-------------|
| Vercel Frontend | ✅ Free | $20/mo | Pro for prod |
| Vercel Backend | ⚠️ 100 calls/day | Included | Pro for prod |
| Neon Database | ✅ 0.5GB | $15/mo | Pro for prod |
| **TOTAL** | **$0** | **$35/mo** | **$35-50/mo** |

**⚠️ Free tier limitations:**
- Only 100 serverless function calls per day
- **NOT suitable for production** (even small apps exceed this)
- Recommended: Upgrade to Pro ($20/mo) for unlimited API calls

---

## 🔗 Useful Links

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Neon Console**: https://console.neon.tech
- **Vercel Docs**: https://vercel.com/docs
- **Neon Docs**: https://neon.tech/docs

---

## ⚠️ Common Issues

### "Database connection refused"
- ✅ Check `DATABASE_URL` in Vercel environment variables
- ✅ Verify Neon project is running
- ✅ Check IP whitelist (Neon: Allow all IPs for Vercel)

### "Cannot find module 'pg'"
- ✅ Run: `npm install pg` in backend folder
- ✅ Commit and push to GitHub
- ✅ Redeploy on Vercel

### "Function timed out"
- ✅ Use Pro plan ($60s timeout instead of 10s)
- ✅ OR optimize queries (add indexes, caching)
- ✅ Consider moving to Railway.app instead

### "API returning 403 CORS error"
- ✅ Check `CLIENT_URL` environment variable
- ✅ Verify frontend URL in allowedOrigins

---

## 🎯 Next Steps After Deployment

1. **Test API endpoints** in frontend
2. **Monitor logs** in Vercel Dashboard
3. **Set up analytics** (Vercel has built-in)
4. **Configure custom domain** (Vercel → Settings → Domains)
5. **Enable auto-deployments** from GitHub

---

## 💡 Alternative: Use Railway (More Reliable for API)

If you want better performance and reliability:

1. **Frontend**: Vercel (Free)
2. **Backend**: Railway.app ($5-10/mo)
3. **Database**: Railway PostgreSQL ($5/mo)

**Total: ~$10-15/month** (better than $35/month with Vercel Pro)

Setup guide: Ask for Railway deployment guide.

---

## 📞 Support

- Stuck? Check VERCEL_DEPLOYMENT.md for detailed guide
- Error logs available in Vercel Dashboard → Deployments → Logs
- Database issues? Check Neon Dashboard → Monitoring

