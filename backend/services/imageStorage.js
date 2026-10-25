const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary here as well, so this module doesn't depend on posts.js having loaded first
if (process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

// Lambda's /var/task is read-only; local disk fallback must use /tmp there
const isLambda =
  !!process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.RUNTIME === 'lambda';
const UPLOADS_ROOT = isLambda
  ? path.join('/tmp', 'hope-for-paws-uploads')
  : path.join(__dirname, '..', 'uploads');

// Only real raster images are accepted. The type is detected from the file's first bytes,
// never from the name or the Content-Type the browser sends (those can be faked).
const IMAGE_TYPES = {
  jpeg: { ext: '.jpg', mime: 'image/jpeg' },
  png: { ext: '.png', mime: 'image/png' },
  webp: { ext: '.webp', mime: 'image/webp' },
  gif: { ext: '.gif', mime: 'image/gif' },
  bmp: { ext: '.bmp', mime: 'image/bmp' },
  avif: { ext: '.avif', mime: 'image/avif' }
};

const detectImageType = (buffer) => {
  if (!buffer || buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'jpeg';
  if (buffer.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (buffer.slice(0, 4).toString('ascii') === 'RIFF' && buffer.slice(8, 12).toString('ascii') === 'WEBP') return 'webp';
  const head = buffer.slice(0, 6).toString('ascii');
  if (head === 'GIF87a' || head === 'GIF89a') return 'gif';
  if (buffer[0] === 0x42 && buffer[1] === 0x4d) return 'bmp';
  if (buffer.slice(4, 8).toString('ascii') === 'ftyp' && /^avi[fs]$/.test(buffer.slice(8, 12).toString('ascii'))) return 'avif';
  return null;
};

const isCloudinaryConfigured = () =>
  Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

const isCloudinaryUrl = (url) => typeof url === 'string' && /^https:\/\/res\.cloudinary\.com\//.test(url);

// "https://res.cloudinary.com/<cloud>/image/upload/v123/hope-for-paws/products/abc.jpg" -> "hope-for-paws/products/abc"
const cloudinaryPublicIdFromUrl = (url) => {
  const idx = url.indexOf('/upload/');
  if (idx === -1) return null;
  let parts = url.slice(idx + '/upload/'.length).split(/[?#]/)[0].split('/').filter(Boolean);
  const versionIdx = parts.findIndex((p) => /^v\d+$/.test(p));
  if (versionIdx >= 0) {
    parts = parts.slice(versionIdx + 1);
  } else {
    // Drop transformation segments such as "c_fill,w_200" (only well-known transformation keys,
    // so folder names like "my_folder" are kept)
    while (parts.length > 1 && (parts[0].includes(',') || /^(w|h|c|q|f|g|ar|dpr|e|t|fl|r|x|y|a|b|o|l|u|bo|co|so|eo|du|z)_[^/]+$/.test(parts[0]))) parts.shift();
  }
  if (parts.length === 0) return null;
  return decodeURIComponent(parts.join('/').replace(/\.[a-z0-9]+$/i, ''));
};

/**
 * Stores one uploaded image (multer memory file) and returns the URL to save in the database.
 * Uses Cloudinary when it's configured (production), otherwise the local uploads folder (development).
 * @param {object} file - multer file with .buffer
 * @param {string} kind - 'products' | 'profile-images'
 */
const saveImage = async (file, kind) => {
  const type = detectImageType(file?.buffer);
  if (!type) {
    const err = new Error('Only JPG, PNG, WEBP, GIF, BMP or AVIF images are allowed.');
    err.status = 400;
    throw err;
  }

  if (isCloudinaryConfigured()) {
    const dataUri = `data:${IMAGE_TYPES[type].mime};base64,${file.buffer.toString('base64')}`;
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: `hope-for-paws/${kind}`,
      resource_type: 'image',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'avif']
    });
    return result.secure_url;
  }

  const dir = path.join(UPLOADS_ROOT, kind);
  await fs.promises.mkdir(dir, { recursive: true });
  const prefix = kind === 'products' ? 'product' : 'profile';
  const filename = `${prefix}-${Date.now()}-${crypto.randomBytes(6).toString('hex')}${IMAGE_TYPES[type].ext}`;
  await fs.promises.writeFile(path.join(dir, filename), file.buffer);
  return `/uploads/${kind}/${filename}`;
};

const saveImages = async (files, kind) => {
  const urls = [];
  try {
    for (const file of files || []) {
      urls.push(await saveImage(file, kind));
    }
  } catch (err) {
    // Don't leave half of a batch behind
    await Promise.all(urls.map((u) => deleteImage(u).catch(() => {})));
    throw err;
  }
  return urls;
};

/**
 * Deletes an image we stored (Cloudinary or local /uploads). Anything else (e.g. a Google avatar) is ignored.
 */
const deleteImage = async (url) => {
  if (!url || typeof url !== 'string') return;
  if (isCloudinaryUrl(url)) {
    if (!isCloudinaryConfigured()) return;
    const publicId = cloudinaryPublicIdFromUrl(url);
    if (publicId) await cloudinary.uploader.destroy(publicId);
    return;
  }
  if (url.startsWith('/uploads/')) {
    // Resolve inside the uploads folder only (no path traversal)
    const fullPath = path.resolve(UPLOADS_ROOT, '.' + url.slice('/uploads'.length));
    if (!fullPath.startsWith(UPLOADS_ROOT + path.sep)) return;
    await fs.promises.unlink(fullPath).catch((err) => {
      if (err.code !== 'ENOENT') throw err;
    });
  }
};

module.exports = {
  UPLOADS_ROOT,
  IMAGE_TYPES,
  detectImageType,
  isCloudinaryConfigured,
  isCloudinaryUrl,
  cloudinaryPublicIdFromUrl,
  saveImage,
  saveImages,
  deleteImage
};
