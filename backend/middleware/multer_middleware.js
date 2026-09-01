const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Centralized absolute paths for upload directories
const PROFILE_IMAGES_DIR = path.join(__dirname, '..', 'uploads', 'profile-images');
const PRODUCT_IMAGES_DIR = path.join(__dirname, '..', 'uploads', 'products');

// Ensure required upload directories exist (created recursively if missing)
[PROFILE_IMAGES_DIR, PRODUCT_IMAGES_DIR].forEach((dir) => {
  fs.mkdirSync(dir, { recursive: true });
});

const profileImageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, PROFILE_IMAGES_DIR);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Configure storage for product images
const productImageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, PRODUCT_IMAGES_DIR);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter for images
const imageFileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const uploadProfileImage = multer({
  storage: profileImageStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  }
});

// Create multer instance for product images
const uploadProductImage = multer({
  storage: productImageStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

module.exports = {
  uploadProfileImage,
  uploadProductImage
};
