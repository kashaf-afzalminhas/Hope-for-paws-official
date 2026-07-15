const multer = require('multer');
const path = require('path');
const fs = require('fs');

const IS_LAMBDA =
  !!process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.RUNTIME === 'lambda';

// Lambda only allows writes under /tmp
const uploadRoot = IS_LAMBDA
  ? path.join('/tmp', 'uploads', 'profile-images')
  : path.join('uploads', 'profile-images');

try {
  fs.mkdirSync(uploadRoot, { recursive: true });
} catch (err) {
  console.warn('Could not create upload directory:', err.message);
}

const profileImageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadRoot);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

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

module.exports = {
  uploadProfileImage,
  uploadRoot,
};
