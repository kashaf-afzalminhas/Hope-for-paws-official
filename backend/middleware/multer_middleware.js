const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { detectImageType } = require('../services/imageStorage');

// Upload folders (still used for older images saved on disk, and as the fallback when Cloudinary isn't configured)
const PROFILE_IMAGES_DIR = path.join(__dirname, '..', 'uploads', 'profile-images');
const PRODUCT_IMAGES_DIR = path.join(__dirname, '..', 'uploads', 'products');
[PROFILE_IMAGES_DIR, PRODUCT_IMAGES_DIR].forEach((dir) => {
  fs.mkdirSync(dir, { recursive: true });
});

// First check (cheap): the browser must say it's an image, and never SVG (SVG can contain scripts).
// The real check of the file's content happens in verifyImageContent below, and the stored
// file's extension is chosen from the detected content, never from the uploaded name.
const imageFileFilter = (req, file, cb) => {
  const mime = String(file.mimetype || '').toLowerCase();
  if (mime.startsWith('image/') && !mime.includes('svg')) {
    cb(null, true);
  } else {
    const err = new Error('Only image files (JPG, PNG, WEBP, GIF, BMP, AVIF) are allowed.');
    err.status = 400;
    cb(err, false);
  }
};

// Removes MongoDB operator keys ("$ne", "$gt", ...) from fields parsed by multer
const stripMongoOperators = (value, depth = 0) => {
  if (!value || typeof value !== 'object' || depth > 10) return;
  for (const key of Object.keys(value)) {
    if (key.startsWith('$')) delete value[key];
    else stripMongoOperators(value[key], depth + 1);
  }
};

// Files are kept in memory and stored by services/imageStorage (Cloudinary or local disk)
// only after the request has been authorised and validated, so rejected requests never leave files behind.
const uploadProfileImage = multer({
  storage: multer.memoryStorage(),
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 }
});

const uploadProductImage = multer({
  storage: multer.memoryStorage(),
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 5 }
});

/**
 * Wraps a multer middleware so upload errors (too big, too many files, wrong type)
 * return a clear 400 instead of a 500.
 */
const handleUpload = (multerMiddleware) => (req, res, next) => {
  multerMiddleware(req, res, (err) => {
    if (!err) {
      stripMongoOperators(req.body);
      return next();
    }
    if (err instanceof multer.MulterError) {
      const messages = {
        LIMIT_FILE_SIZE: 'Each image must be 5MB or smaller.',
        LIMIT_FILE_COUNT: 'Too many images. You can upload up to 5.',
        LIMIT_UNEXPECTED_FILE: 'Too many images or an unexpected file field.'
      };
      return res.status(400).json({ message: messages[err.code] || 'Image upload failed.' });
    }
    return res.status(err.status || 400).json({ message: err.message || 'Image upload failed.' });
  });
};

// Second check (strict): the file content itself must be a real image (magic bytes)
const verifyImageContent = (req, res, next) => {
  const files = [];
  if (req.file) files.push(req.file);
  if (Array.isArray(req.files)) files.push(...req.files);
  else if (req.files && typeof req.files === 'object') Object.values(req.files).forEach((arr) => files.push(...arr));

  for (const file of files) {
    if (!detectImageType(file.buffer)) {
      return res.status(400).json({ message: 'Only JPG, PNG, WEBP, GIF, BMP or AVIF images are allowed. (HEIC photos from iPhone need to be converted first.)' });
    }
  }
  next();
};

module.exports = {
  PROFILE_IMAGES_DIR,
  PRODUCT_IMAGES_DIR,
  uploadProfileImage,
  uploadProductImage,
  handleUpload,
  verifyImageContent
};
