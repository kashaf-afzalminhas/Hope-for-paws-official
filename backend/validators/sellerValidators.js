const { body, param } = require('express-validator');

/**
 * Validation rules for seller onboarding
 */
exports.onboardSellerRules = [
  // Full name, email and phone are taken from the user's account on the server,
  // so they are optional here (the store setup form shows them read-only).
  body('fullName')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage('Full name must be at most 100 characters'),

  body('storeName')
    .trim()
    .notEmpty()
    .withMessage('Store name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Store name must be 2-100 characters'),

  body('email')
    .optional({ checkFalsy: true })
    .trim(),

  // Only used when the account has no phone number yet (e.g. Google sign-up)
  body('phone')
    .optional({ checkFalsy: true })
    .trim()
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
