const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { v4: uuid } = require('uuid');

// Import provider configs
const { uploadCloudinary, isConfigured: cloudinaryConfigured, deleteCloudinaryFile, getPublicIdFromUrl } = require('./cloudinary');
const { s3, makeUploader: makeS3Uploader } = require('./s3');

const uploadProvider = (process.env.UPLOAD_PROVIDER || 'local').toLowerCase();

/**
 * Get the appropriate upload middleware based on UPLOAD_PROVIDER
 * @param {string} folder - Folder name for organizing uploads
 * @param {number} maxMB - Max file size in MB
 * @returns {object} Upload middleware object
 */
const getUploadMiddleware = (folder, maxMB = 10) => {
  if (uploadProvider === 'cloudinary' && cloudinaryConfigured) {
    return createCloudinaryUploader(folder, maxMB);
  }
  
  // Fallback to S3 or local
  return makeS3Uploader(folder, maxMB);
};

/**
 * Create Cloudinary-based uploader
 */
const createCloudinaryUploader = (folder, maxMB = 10) => {
  const ALLOWED_MIME = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
  ];

  // Cloudinary multer instance already includes a fileFilter configured in cloudinary.js
  const uploader = uploadCloudinary;

  return {
    single: (field) => uploader.single(field),
    array: (field, maxCount) => uploader.array(field, maxCount),
    fields: (fields) => uploader.fields(fields),
    any: () => uploader.any(),
    none: () => uploader.none(),
  };
};

/**
 * Delete a file based on upload provider
 * @param {string} fileUrl - File URL or path
 * @returns {Promise<boolean>}
 */
const deleteFile = async (fileUrl) => {
  if (!fileUrl) return false;

  try {
    if (uploadProvider === 'cloudinary') {
      const publicId = getPublicIdFromUrl(fileUrl);
      if (publicId) {
        return await deleteCloudinaryFile(publicId);
      }
    } else {
      // For local/S3, you can implement deletion logic here
      // Local example:
      if (fileUrl.includes('/uploads/')) {
        const localPath = path.join(__dirname, '../../', fileUrl.split('/uploads/')[1]);
        if (fs.existsSync(localPath)) {
          fs.unlinkSync(localPath);
          return true;
        }
      }
    }
  } catch (err) {
    console.error('[ERROR] File deletion failed:', err.message);
  }
  return false;
};

/**
 * Get file URL from upload result
 * @param {object} file - Multer file object
 * @returns {string} Public file URL
 */
const getFileUrl = (file) => {
  if (!file) return null;
  
  if (uploadProvider === 'cloudinary' && file.path) {
    return file.path; // Cloudinary provides the full URL
  }
  
  // S3 or local
  return file.location || file.path || null;
};

/**
 * Middleware to normalize file URLs in request
 */
const normalizeFileUrls = (req, res, next) => {
  if (req.file) {
    req.file.location = getFileUrl(req.file);
  }
  if (req.files) {
    if (Array.isArray(req.files)) {
      req.files.forEach(f => {
        f.location = getFileUrl(f);
      });
    } else if (typeof req.files === 'object') {
      Object.values(req.files).flat().forEach(f => {
        f.location = getFileUrl(f);
      });
    }
  }
  next();
};

module.exports = {
  getUploadMiddleware,
  deleteFile,
  getFileUrl,
  normalizeFileUrls,
  uploadProvider,
};
