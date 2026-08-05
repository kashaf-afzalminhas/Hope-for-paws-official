const express = require('express');
const router = express.Router();
const { validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const { uploadProfileImage, uploadProductImage } = require('../middleware/multer_middleware');
const { onboardSellerRules, updateStatusRules } = require('../validators/sellerValidators');
const {
  onboardSeller,
  getMySellerProfile,
  updateSellerStatus,
  getAllSellerApplications,
  getSellerApplicationById
} = require('../controllers/sellerController');
const { getSellerOrders, updateOrderStatus, getDashboardStats } = require('../controllers/orderController');
const { listMyProducts, createProduct, updateProduct, deleteProduct, getSellerProductById, toggleProductVisibility } = require('../controllers/productController');


/**
 * Middleware to handle validation errors
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array().map(e => ({ field: e.path, message: e.msg }))
    });
  }
  next();
};

// POST /api/sellers/onboard - Onboard as a seller (requires auth)
router.post('/onboard', auth, uploadProfileImage.single('profileImage'), onboardSellerRules, validate, onboardSeller);

// GET /api/sellers/me - Get current user's seller profile
router.get('/me', auth, getMySellerProfile);

// PATCH /api/sellers/status/:userId - Update seller isVerified status (admin only)
router.patch('/status/:userId', auth, updateStatusRules, validate, updateSellerStatus);

// GET /api/sellers/admin/all - Admin gets all seller profiles
router.get('/admin/all', auth, getAllSellerApplications);

// GET /api/sellers/admin/:sellerId - Admin gets single seller profile
router.get('/admin/:sellerId', auth, getSellerApplicationById);

// --- Seller Dashboard Routes ---
// Products CRUD
router.get('/products', auth, listMyProducts);
router.get('/products/:id', auth, getSellerProductById);
router.post('/products', auth, uploadProductImage.array('media', 5), createProduct);
router.put('/products/:id', auth, uploadProductImage.array('media', 5), updateProduct);
router.delete('/products/:id', auth, deleteProduct);
router.patch('/products/:id/toggle-visibility', auth, toggleProductVisibility);

// Orders Management
router.get('/orders', auth, getSellerOrders);
router.patch('/orders/:id/status', auth, updateOrderStatus);

// Dashboard Analytics
router.get('/dashboard-stats', auth, getDashboardStats);

module.exports = router;
