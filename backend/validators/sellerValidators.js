const { body, param } = require('express-validator');

/**
 * Validation rules for seller onboarding
 */
exports.onboardSellerRules = [
  body('fullName')
    .trim()
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be 2-100 characters'),

  body('storeName')
    .trim()
    .notEmpty()
    .withMessage('Store name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Store name must be 2-100 characters'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),

  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .isLength({ min: 5, max: 20 })
    .withMessage('Valid phone number is required'),

  body('address')
    .trim()
    .notEmpty()
    .withMessage('Address is required')
    .isLength({ min: 2, max: 200 })
    .withMessage('Address must be 2-200 characters'),

];

/**
 * Validation rules for updating seller status (admin only)
 */
exports.updateStatusRules = [
  param('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isMongoId()
    .withMessage('Invalid user ID format'),

  body('isVerified')
    .isBoolean()
    .withMessage('isVerified must be a boolean')
];
