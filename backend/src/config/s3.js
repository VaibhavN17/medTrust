const { S3Client } = require('@aws-sdk/client-s3');
const multer        = require('multer');
const multerS3      = require('multer-s3');
const fs            = require('fs');
const path          = require('path');
const { v4: uuid }  = require('uuid');

const uploadProvider = (process.env.UPLOAD_PROVIDER || 'local').toLowerCase();
const wantsS3 = uploadProvider === 's3';

const hasS3Config = Boolean(
  process.env.AWS_REGION &&
  process.env.AWS_ACCESS_KEY_ID &&
  process.env.AWS_SECRET_ACCESS_KEY &&
  process.env.AWS_BUCKET_NAME
);

const useS3 = wantsS3 && hasS3Config;
const localUploadRoot = path.resolve(__dirname, '../../uploads');

const s3 = useS3
  ? new S3Client({
    region:      process.env.AWS_REGION,
    credentials: {
      accessKeyId:     process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  })
  : null;

const createS3ConfigError = () => {
  const err = new Error('File uploads are disabled. Set AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_BUCKET_NAME in backend/.env');
  err.statusCode = 503;
  return err;
};

const ALLOWED_MIME = [
  'image/jpeg', 'image/png', 'image/webp',
  'application/pdf',
];

const fileFilter = (_req, file, cb) => {
  if (wantsS3 && !hasS3Config) return cb(createS3ConfigError(), false);
  if (ALLOWED_MIME.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Only JPG, PNG, WEBP, PDF files are allowed'), false);
};

const getPublicBaseUrl = (req) =>
  process.env.PUBLIC_API_URL || `${req.protocol}://${req.get('host')}`;

const attachLocation = (req, file, folder) => {
  if (!file || file.location) return;
  const filePath = `/uploads/${folder}/${file.filename}`;
  file.location = `${getPublicBaseUrl(req)}${filePath}`;
};

const withLocation = (middleware, folder) => (req, res, next) => {
  middleware(req, res, (err) => {
    if (err) return next(err);

    if (req.file) attachLocation(req, req.file, folder);

    if (Array.isArray(req.files)) {
      req.files.forEach((f) => attachLocation(req, f, folder));
    } else if (req.files && typeof req.files === 'object') {
      Object.values(req.files)
        .flat()
        .forEach((f) => attachLocation(req, f, folder));
    }

    next();
  });
};

/** Generic S3 uploader – pass a folder prefix */
const makeUploader = (folder, maxMB = 10) => {
  const storage = useS3
    ? multerS3({
      s3,
      bucket:      process.env.AWS_BUCKET_NAME,
      acl:         'private',
      contentType: multerS3.AUTO_CONTENT_TYPE,
      key: (_req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${folder}/${uuid()}${ext}`);
      },
    })
    : multer.diskStorage({
      destination: (_req, _file, cb) => {
        const targetDir = path.join(localUploadRoot, folder);
        fs.mkdirSync(targetDir, { recursive: true });
        cb(null, targetDir);
      },
      filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${uuid()}${ext}`);
      },
    });

  const uploader = multer({
    storage,
    limits: { fileSize: maxMB * 1024 * 1024 },
    fileFilter,
  });

  return {
    single: (field) => withLocation(uploader.single(field), folder),
    array: (field, maxCount) => withLocation(uploader.array(field, maxCount), folder),
    fields: (fields) => withLocation(uploader.fields(fields), folder),
    any: () => withLocation(uploader.any(), folder),
    none: () => uploader.none(),
  };
};

module.exports = { s3, makeUploader };
