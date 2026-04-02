const { body, param } = require('express-validator');

/**
 * Validation rules for seller registration/apply
 */
exports.applySellerRules = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be 2-100 characters'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),

  body('cnic')
    .trim()
    .notEmpty()
    .withMessage('CNIC is required')
    .matches(/^[0-9]{5}-[0-9]{7}-[0-9]$/)
    .withMessage('CNIC format should be 12345-1234567-1'),

  body('location')
    .trim()
    .notEmpty()
    .withMessage('Location is required')
    .isLength({ min: 2, max: 200 })
    .withMessage('Location must be 2-200 characters')
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

  body('status')
    .trim()
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['pending', 'verified', 'suspended'])
    .withMessage('Status must be pending, verified, or suspended'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must be under 500 characters')
];
