const express = require('express');
const router = express.Router();
const promoController = require('../controllers/promoController');
const { verifyToken, optionalAuth } = require('../middlewares/authMiddleware');

router.post('/create', verifyToken, promoController.createPromoCode);
router.get('/seller', verifyToken, promoController.getSellerPromos);
router.post('/apply', optionalAuth || verifyToken, promoController.applyPromoCode);

module.exports = router;