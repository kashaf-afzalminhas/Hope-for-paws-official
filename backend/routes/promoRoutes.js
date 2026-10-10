const express = require('express');
const router = express.Router();
const promoController = require('../controllers/promoController');
const auth = require('../middleware/auth');

// Seller endpoints require auth
router.post('/create', auth, promoController.createPromoCode);
router.get('/seller', auth, promoController.getSellerPromos);
router.put('/:id', auth, promoController.updatePromoCode);
router.delete('/:id', auth, promoController.deletePromoCode);

// Apply promo route (can be used during checkout)
router.post('/apply', (req, res, next) => {
  if (req.headers.authorization) {
    return auth(req, res, next);
  }
  next();
}, promoController.applyPromoCode);

module.exports = router;