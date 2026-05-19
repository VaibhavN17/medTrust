const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

const hasCloudinaryUrl = Boolean(process.env.CLOUDINARY_URL);
const hasIndividualCredentials = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

// Configure Cloudinary from CLOUDINARY_URL when present, otherwise fall back to discrete values.
if (hasCloudinaryUrl) {
  cloudinary.config({ secure: true });
} else if (hasIndividualCredentials) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

// Check if Cloudinary is properly configured
const isConfigured = hasCloudinaryUrl || hasIndividualCredentials;

// Cloudinary storage for multer
const storage = isConfigured
  ? new CloudinaryStorage({
      cloudinary: cloudinary,
      params: {
        folder: 'medtrust',
        resource_type: 'auto',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
      },
    })
  : null;

// Multer middleware for Cloudinary
const uploadCloudinary = isConfigured
  ? multer({
      storage,
      limits: {
        fileSize: 50 * 1024 * 1024, // 50 MB
      },
      fileFilter: (_req, file, cb) => {
        const ALLOWED_MIME = [
          'image/jpeg',
          'image/png',
          'image/webp',
          'application/pdf',
        ];
        if (ALLOWED_MIME.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new Error('Only JPG, PNG, WEBP, and PDF files are allowed'),
            false
          );
        }
      },
    })
  : null;

// Helper to delete Cloudinary image
const deleteCloudinaryFile = async (publicId) => {
  if (!isConfigured) return false;
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === 'ok';
  } catch (err) {
    console.error('[ERROR] Cloudinary delete failed:', err.message);
    return false;
  }
};

// Helper to extract public ID from Cloudinary URL
const getPublicIdFromUrl = (url) => {
  if (!url) return null;
  // Format: https://res.cloudinary.com/cloud_name/image/upload/v1234567/medtrust/filename.jpg
  const match = url.match(/\/medtrust\/([^/]+?)(?:\.\w+)?$/);
  return match ? `medtrust/${match[1]}` : null;
};

module.exports = {
  cloudinary,
  storage,
  uploadCloudinary,
  isConfigured,
  deleteCloudinaryFile,
  getPublicIdFromUrl,
};
