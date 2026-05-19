# Avatar & Logo Feature Deployment Guide

**Commit**: `e10f5e2` - feat: Add avatar display and NGO logo upload support

## Step 1: Database Migration

### For PostgreSQL (Neon recommended):

```sql
-- Run this on your PostgreSQL database
ALTER TABLE ngo_profiles ADD COLUMN logo_url TEXT;
```

**Steps to run:**
1. Log in to Neon console: https://neon.tech
2. Select your project
3. Go to "SQL Editor"
4. Paste the above command and execute
5. Verify the column was added

### For MySQL:

```sql
-- If using PlanetScale MySQL
ALTER TABLE ngo_profiles ADD COLUMN logo_url TEXT;
```

**Steps to run:**
1. Connect to your MySQL database via command line or GUI tool
2. Use your database: `USE medtrust;`
3. Run the ALTER TABLE command above
4. Verify: `DESCRIBE ngo_profiles;` should show logo_url column

---

## Step 2: Backend Deployment (Updated NGO Endpoints)

### Changes Deployed:
- ✅ New NGO profile GET endpoint: `/ngo/profile`
- ✅ New NGO profile PUT endpoint: `/ngo/profile` (with logo upload)
- ✅ Updated ngoController with getProfile() and updateProfile() methods

### Deployment Options:

#### Option A: Vercel Functions (Recommended)
```bash
cd backend
npm install  # Ensure all dependencies are installed
vercel deploy --prod
```

#### Option B: Manual Server Deployment
```bash
# On your server
cd /app/medtrust/backend
git pull origin main
npm install
npm restart  # or your pm2/systemd restart command
```

**After deployment, verify routes are working:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://your-backend-url/api/ngo/profile
```

---

## Step 3: Frontend Deployment (Vercel Auto-Deploy)

### Automatic Deployment:
Since your frontend is on Vercel with GitHub integration, deployment happens automatically when you push to main:

1. ✅ Code pushed to `origin/main` (already done)
2. ✓ Vercel automatically detects changes
3. ✓ Runs `npm run build` (tests passed ✅)
4. ✓ Deploys to production

**Check deployment status:**
- Go to: https://vercel.com/dashboard
- Select your MedTrust project
- View "Deployments" tab
- Should show new deployment in progress or completed

### Build Status:
- ✅ TypeScript compilation: PASSED
- ✅ Linting: PASSED
- ✅ New route: `/dashboard/ngo/profile` (3.04 kB)
- ✅ Production build: SUCCESSFUL

---

## Step 4: Verification Checklist

After all three steps are complete, verify the features work:

### User Avatar Display (All Users)
- [ ] Go to any page and check Navbar top-right
- [ ] If user has avatar_url: Should see profile picture
- [ ] If no avatar_url: Should see gradient badge with initial letter
- [ ] Click avatar to verify dropdown still works

### Profile Avatar Display (Your Profile)
- [ ] Go to `/profile` page
- [ ] Check top of profile card
- [ ] If avatar_url exists: Should see circular image
- [ ] If not: Should see gradient badge

### NGO Logo Upload (NGO Users Only)
- [ ] Log in as NGO user
- [ ] Go to `/dashboard/ngo/profile`
- [ ] Should see organization form with logo upload section
- [ ] Upload a test logo (PNG/JPG/WebP, <5MB)
- [ ] Should see preview before upload
- [ ] Submit form - should show success message
- [ ] Refresh page - logo should persist

### API Endpoints
```bash
# Get NGO profile (requires NGO/admin token)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://your-backend-url/api/ngo/profile

# Update NGO profile with logo
curl -X PUT \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "org_name=Your Org" \
  -F "logo=@logo.png" \
  https://your-backend-url/api/ngo/profile
```

---

## Database Rollback (If Needed)

If something goes wrong and you need to undo:

```sql
-- CAUTION: Only if absolutely necessary
ALTER TABLE ngo_profiles DROP COLUMN logo_url;
```

Then redeploy with `git revert` or checkout previous commit.

---

## Environment Variables to Check

Ensure your backend deployment has these env vars set:

```
DATABASE_URL=postgresql://... or mysql://...
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
UPLOAD_PROVIDER=cloudinary
```

---

## Troubleshooting

### Issue: NGO profile endpoints return 404
- [ ] Verify backend deployment is complete
- [ ] Check `backend/src/routes/index.js` has been updated
- [ ] Verify authentication token is valid

### Issue: Logo upload fails  
- [ ] Check Cloudinary credentials in environment
- [ ] Ensure UPLOAD_PROVIDER=cloudinary is set
- [ ] Check file size is < 5MB

### Issue: Avatar not showing in Navbar
- [ ] Ensure user.avatar_url is set in database
- [ ] Check that `/auth/me` endpoint returns avatar_url field
- [ ] Verify frontend rebuild completed on Vercel

### Issue: Column logo_url already exists
- [ ] Check if migration was already run
- [ ] If so, you can skip the migration step

---

## Summary

**Commit deployed**: e10f5e2  
**Files updated**: 6 files modified, 1 new file  
**Build status**: ✅ Production ready  
**Database migration**: Required  
**Backend redeploy**: Required  
**Frontend redeploy**: Automatic (via Vercel GitHub integration)

**Total deployment time**: 10-15 minutes

---

## Support

For issues or questions about this deployment:
1. Check the verification checklist above
2. Review troubleshooting section
3. Check git log: `git log --oneline | head -5` to verify commit was pushed
4. Review environment variables are set correctly on hosting platform
