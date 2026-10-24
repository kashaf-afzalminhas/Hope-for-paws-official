const express = require('express');
const router = express.Router();
const { validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const { uploadProfileImage, uploadProductImage, handleUpload, verifyImageContent } = require('../middleware/multer_middleware');
const { onboardSellerRules, updateStatusRules } = require('../validators/sellerValidators');
const {
  onboardSeller,
  getMySellerProfile,
  updateSellerStatus,
  getAllSellerApplications,
  getSellerApplicationById
} = require('../controllers/sellerController');
const { getSellerOrders, updateOrderStatus, getDashboardStats } = require('../controllers/orderController');
const { listMyProducts, listMyProductCategories, createProduct, updateProduct, deleteProduct, getSellerProductById, toggleProductVisibility, requireActiveSeller } = require('../controllers/productController');
const { getSellerReviews } = require('../controllers/reviewController');
const {
  listGuaranteePolicies, createGuaranteePolicy, updateGuaranteePolicy, deleteGuaranteePolicy,
  listShippingPolicies, createShippingPolicy, updateShippingPolicy, deleteShippingPolicy, getPolicyTemplates
} = require('../controllers/policyController');


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
router.post('/onboard', auth, handleUpload(uploadProfileImage.single('profileImage')), verifyImageContent, onboardSellerRules, validate, onboardSeller);

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
router.get('/product-categories', auth, listMyProductCategories);
router.get('/products/:id', auth, getSellerProductById);
// The seller check runs before the upload, so non-sellers and suspended sellers can't upload files
router.post('/products', auth, requireActiveSeller, handleUpload(uploadProductImage.array('media', 5)), verifyImageContent, createProduct);
router.put('/products/:id', auth, requireActiveSeller, handleUpload(uploadProductImage.array('media', 5)), verifyImageContent, updateProduct);
router.delete('/products/:id', auth, requireActiveSeller, deleteProduct);
router.patch('/products/:id/toggle-visibility', auth, toggleProductVisibility);

// Orders Management
router.get('/orders', auth, getSellerOrders);
router.patch('/orders/:id/status', auth, updateOrderStatus);

// Dashboard Analytics
router.get('/dashboard-stats', auth, getDashboardStats);

// Reviews — Fetch all reviews for the seller's products
router.get('/reviews', auth, getSellerReviews);
// Reusable seller policies
router.get('/policies/templates', auth, getPolicyTemplates);
router.get('/policies/guarantees', auth, listGuaranteePolicies);
router.post('/policies/guarantees', auth, createGuaranteePolicy);
router.put('/policies/guarantees/:id', auth, updateGuaranteePolicy);
router.delete('/policies/guarantees/:id', auth, deleteGuaranteePolicy);
router.get('/policies/shipping', auth, listShippingPolicies);
router.post('/policies/shipping', auth, createShippingPolicy);
router.put('/policies/shipping/:id', auth, updateShippingPolicy);
router.delete('/policies/shipping/:id', auth, deleteShippingPolicy);

module.exports = router;
