# Cloudinary Integration Setup Guide

## 1. Sign up for Cloudinary Free Tier

1. Go to [https://cloudinary.com/users/register/free](https://cloudinary.com/users/register/free)
2. Sign up with your email or GitHub
3. Verify your email
4. Go to your **Dashboard**

## 2. Get Your API Credentials

In your Cloudinary Dashboard:

1. Navigate to **Settings** (bottom left gear icon)
2. Go to **API Keys** tab
3. You'll see:
   - **Cloud Name** - Your unique identifier (required)
   - **API Key** - Public key (required)
   - **API Secret** - Keep this private (required)

## 3. Update Your `.env` File

In `backend/.env`, add:

```env
UPLOAD_PROVIDER=cloudinary

CLOUDINARY_URL=cloudinary://YOUR_API_KEY:YOUR_API_SECRET@dkbobpqaz
```

**Example:**
```env
UPLOAD_PROVIDER=cloudinary
CLOUDINARY_URL=cloudinary://827349287349823:dkfj-sdfkj-skdfj-sdfklj@medtrust-app
```

If you prefer separate variables, the backend also accepts:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

## 4. Install Dependencies

```bash
cd backend
npm install
```

This installs:
- `cloudinary` - Cloudinary SDK
- `multer-storage-cloudinary` - Multer integration

## 5. Update Routes (if needed)

Your routes in `src/routes/index.js` already work! Just make sure you're using:

```javascript
const { getUploadMiddleware, normalizeFileUrls } = require('../config/upload');

const avatarUp  = getUploadMiddleware('avatars', 5);
const coverUp   = getUploadMiddleware('covers', 8);
const docUp     = getUploadMiddleware('documents', 15);
```

Then in your route handlers:
```javascript
router.put('/auth/profile',  
  authenticate, 
  avatarUp.single('avatar'),
  normalizeFileUrls,  // This middleware normalizes URLs
  auth.updateProfile
);
```

## 6. Update Controllers (to handle file deletion)

In your controllers, when updating/deleting files:

```javascript
const { deleteFile, getFileUrl } = require('../config/upload');

// Delete old file
if (campaign.cover_image_url) {
  await deleteFile(campaign.cover_image_url);
}

// Upload new file
if (req.file) {
  campaign.cover_image_url = getFileUrl(req.file);
  // Or simply: campaign.cover_image_url = req.file.location;
}

await campaign.save();
```

## 7. Cloudinary Free Tier Includes

✅ **25 GB Storage** - Plenty for college projects  
✅ **25 GB Bandwidth/month** - Good for medium traffic  
✅ **Image Transformations** - Resize, crop, optimize on the fly  
✅ **CDN Delivery** - Fast global delivery  
✅ **Automatic Optimization** - WebP conversion, compression  
✅ **API Access** - Full access to upload/delete/manage  

## 8. Example: Upload a Campaign Cover Image

**Frontend** (Next.js):
```typescript
const handleUpload = async (file: File) => {
  const formData = new FormData();
  formData.append('cover_image', file);
  formData.append('title', 'My Campaign');
  
  const response = await fetch('/api/campaigns', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  
  const campaign = await response.json();
  console.log('Image URL:', campaign.cover_image_url);
  // Returns: https://res.cloudinary.com/your-cloud/image/upload/v123/medtrust/abc123.jpg
};
```

**Backend** (Express):
```javascript
router.post('/campaigns', 
  authenticate, 
  authorize('patient'),
  coverUp.single('cover_image'),  // Uploads to Cloudinary automatically
  normalizeFileUrls,  // Normalizes the URL
  [
    body('title').trim().notEmpty(),
  ],
  validate,
  campaign.create  // Your controller
);
```

## 9. Transformations (Bonus Features)

Cloudinary allows on-the-fly transformations:

```javascript
// Original URL
https://res.cloudinary.com/medtrust-app/image/upload/v123/medtrust/img.jpg

// Resized to 300px width
https://res.cloudinary.com/medtrust-app/image/upload/w_300/v123/medtrust/img.jpg

// Resized + optimized
https://res.cloudinary.com/medtrust-app/image/upload/w_300,q_auto,f_auto/v123/medtrust/img.jpg

// Thumbnail (300x300, fill)
https://res.cloudinary.com/medtrust-app/image/upload/w_300,h_300,c_fill/v123/medtrust/img.jpg
```

## 10. Troubleshooting

**Issue: "File uploads are disabled"**
- Make sure `UPLOAD_PROVIDER=cloudinary` in `.env`
- Verify all 3 Cloudinary credentials are set
- Check for typos in credential names

**Issue: "Only JPG, PNG, WEBP, PDF files allowed"**
- Make sure you're uploading one of the supported formats

**Issue: Files uploading but URL is wrong**
- Make sure `normalizeFileUrls` middleware is in your route
- Check that `CLOUDINARY_URL` or `CLOUDINARY_CLOUD_NAME` is correct

**Check Cloudinary Storage:**
- Go to Cloudinary Dashboard → **Media Library**
- All uploads will be in the `medtrust` folder

---

That's it! Your MedTrust app now uses Cloudinary for image handling. 🎉
