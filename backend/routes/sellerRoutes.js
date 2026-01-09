const express = require('express');
const router = express.Router();
const { validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const { applySellerRules, updateStatusRules } = require('../validators/sellerValidators');
const {
  applyAsSeller,
  getMySellerProfile,
  updateSellerStatus
} = require('../controllers/sellerController');

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

// POST /api/sellers/apply - Apply as a seller (requires auth)
router.post('/apply', auth, applySellerRules, validate, applyAsSeller);

// GET /api/sellers/me - Get current user's seller profile
router.get('/me', auth, getMySellerProfile);

// PATCH /api/sellers/status/:userId - Update seller status (admin only)
router.patch('/status/:userId', auth, updateStatusRules, validate, updateSellerStatus);

module.exports = router;
