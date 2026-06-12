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

  body('bankName')
    .trim()
    .notEmpty()
    .withMessage('Bank Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Bank Name must be between 2 and 100 characters'),

  body('accountTitle')
    .trim()
    .notEmpty()
    .withMessage('Account Title is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Account Title must be between 2 and 100 characters'),

  body('accountNumber')
    .trim()
    .notEmpty()
    .withMessage('Account Number / IBAN is required')
    .matches(/^[A-Za-z0-9\s-]+$/)
    .withMessage('Account Number must contain only alphanumeric characters, spaces, or hyphens')
    .isLength({ min: 8, max: 34 })
    .withMessage('Account Number / IBAN must be between 8 and 34 characters')
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
