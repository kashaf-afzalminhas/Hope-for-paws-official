const PromoCode = require('../models/PromoCode');
const Seller = require('../models/Seller');
const Product = require('../models/Product');
const mongoose = require('mongoose');
const { findActivePromoByCode, evaluatePromo, toPktDayBoundary } = require('../services/promoService');

exports.createPromoCode = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const seller = await Seller.findOne({ userId });
    if (!seller) {
      return res.status(403).json({ message: 'Only registered sellers can create promo codes.' });
    }

    const {
      code,
      scope,
      selectedCategories,
      mechanism,
      discountValue,
      customRewardText,
      hasMaxDiscountCap,
      maxDiscountCap,
      minSpend,
      startDate,
      endDate,
      totalUsageLimit,
      perBuyerLimit,
    } = req.body;

    // Dates are whole days in Pakistan time, whatever timezone the server runs in
    const startDatetime = toPktDayBoundary(startDate, false);
    const endDatetime = toPktDayBoundary(endDate, true);
    if (Number.isNaN(startDatetime.getTime()) || Number.isNaN(endDatetime.getTime())) {
      return res.status(400).json({ message: 'Please choose valid start and end dates.' });
    }
    if (typeof code !== 'string' || !/^[A-Za-z0-9]{4,16}$/.test(code.trim())) {
      return res.status(400).json({ message: 'Promo code must be 4–16 letters or numbers.' });
    }

    if (endDatetime <= startDatetime) {
      return res.status(400).json({ message: 'End date must be after Start date.' });
    }

    const existing = await PromoCode.findOne({ code: code.toUpperCase(), isActive: true });
    if (existing) {
      return res.status(400).json({ message: `Promo code ${code} is already in use.` });
    }

    const newPromo = new PromoCode({
      code: code.toUpperCase(),
      sellerId: seller._id,
      sellerStoreName: seller.storeName || 'Partner Store',
      scope: scope || 'WHOLE_STORE',
      applicableCategories: scope === 'SPECIFIC_CATEGORY' ? selectedCategories : [],
      discountMechanism: mechanism,
      discountValue:
        mechanism === 'FREE_SHIPPING' || mechanism === 'CUSTOM_REWARD'
          ? 0
          : parseFloat(discountValue) || 0,
      customRewardText: mechanism === 'CUSTOM_REWARD' ? customRewardText : null,
      maxDiscountCap:
        hasMaxDiscountCap && mechanism === 'PERCENTAGE'
          ? parseFloat(maxDiscountCap)
          : null,
      minSpend: parseFloat(minSpend) || 0,
      startDatetime,
      endDatetime,
      totalUsageLimit: totalUsageLimit ? parseInt(totalUsageLimit, 10) : null,
      perBuyerLimit: perBuyerLimit ? parseInt(perBuyerLimit, 10) : 1,
    });

    await newPromo.save();
    return res.status(201).json({ success: true, promo: newPromo });
  } catch (error) {
    console.error('Error creating promo code:', error);
    return res.status(500).json({ message: error.message || 'Server error' });
  }
};

exports.getSellerPromos = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const seller = await Seller.findOne({ userId });
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found.' });
    }

    const promos = await PromoCode.find({ sellerId: seller._id }).sort({ createdAt: -1 });
    return res.status(200).json(promos);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch promo codes' });
  }
};

exports.applyPromoCode = async (req, res) => {
  try {
    const { code, cartItems = [] } = req.body || {};
    const userId = req.user?.id || req.user?.userId;

    if (typeof code !== 'string' || !code.trim()) {
      return res.status(400).json({ valid: false, message: 'Please enter a promo code.' });
    }

    const promo = await findActivePromoByCode(code);
    if (!promo) {
      return res.status(404).json({
        valid: false,
        message: 'This promo code is invalid, inactive, or does not exist.',
      });
    }

    // Resolve every cart item from the database: price, seller and category are never taken from the browser
    const items = [];
    for (const item of Array.isArray(cartItems) ? cartItems.slice(0, 100) : []) {
      const prodId = item?.productId || item?.product?._id || item?._id;
      if (!prodId || !mongoose.Types.ObjectId.isValid(String(prodId))) continue;
      const dbProduct = await Product.findById(prodId).select('sellerId category price discountPercentage');
      if (!dbProduct) continue;
      const qty = Number(item.quantity);
      const unitPrice = dbProduct.discountPercentage > 0
        ? dbProduct.price * (1 - dbProduct.discountPercentage / 100)
        : dbProduct.price;
      items.push({
        productId: dbProduct._id,
        sellerId: dbProduct.sellerId ? dbProduct.sellerId.toString() : null,
        category: dbProduct.category || '',
        price: unitPrice,
        quantity: Number.isInteger(qty) && qty > 0 ? Math.min(qty, 100) : 1,
      });
    }

    const result = await evaluatePromo({ promo, items, userId });
    if (!result.valid) {
      return res.status(result.status || 400).json({
        valid: false,
        message: result.message,
        ...(result.state ? { state: result.state } : {}),
        ...(result.extra || {}),
      });
    }

    const { discountAmount, waivedShipping, customReward, eligibleItems } = result;
    let successMessage = `✓ "${promo.code}" applied!`;
    if (discountAmount > 0) {
      successMessage += ` You saved Rs. ${discountAmount.toFixed(0)} on ${promo.sellerStoreName} items.`;
    } else if (waivedShipping) {
      successMessage += ` Free shipping applied for ${promo.sellerStoreName}.`;
    } else if (customReward) {
      successMessage += ` Reward unlocked: ${customReward}!`;
    }

    return res.status(200).json({
      valid: true,
      message: successMessage,
      code: promo.code,
      discountAmount,
      waivedShipping,
      customReward,
      sellerId: promo.sellerId.toString(),
      eligibleProductIds: eligibleItems.map((i) => i.productId),
    });
  } catch (error) {
    console.error('applyPromoCode error:', error);
    return res.status(500).json({ message: 'Server error checking promo code' });
  }
};


// PUT /api/promos/:id - Update an existing promo code
exports.updatePromoCode = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const seller = await Seller.findOne({ userId });
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found.' });
    }

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid promo ID.' });
    }
    const {
      scope,
      selectedCategories,
      mechanism,
      discountValue,
      customRewardText,
      hasMaxDiscountCap,
      maxDiscountCap,
      minSpend,
      startDate,
      endDate,
      totalUsageLimit,
      perBuyerLimit,
    } = req.body;

    const promo = await PromoCode.findOne({ _id: id, sellerId: seller._id });
    if (!promo) {
      return res.status(404).json({ message: 'Promo code not found or unauthorized.' });
    }

    if (startDate) {
      const startDatetime = toPktDayBoundary(startDate, false);
      if (Number.isNaN(startDatetime.getTime())) {
        return res.status(400).json({ message: 'Please choose a valid start date.' });
      }
      promo.startDatetime = startDatetime;
    }

    if (endDate) {
      const endDatetime = toPktDayBoundary(endDate, true);
      if (Number.isNaN(endDatetime.getTime())) {
        return res.status(400).json({ message: 'Please choose a valid end date.' });
      }
      if (promo.startDatetime && endDatetime <= promo.startDatetime) {
        return res.status(400).json({ message: 'End date must be after Start date.' });
      }
      promo.endDatetime = endDatetime;
    }

    if (scope) {
      promo.scope = scope;
      promo.applicableCategories = scope === 'SPECIFIC_CATEGORY' ? selectedCategories || [] : [];
    }

    if (mechanism) {
      promo.discountMechanism = mechanism;
      promo.discountValue = (mechanism === 'FREE_SHIPPING' || mechanism === 'CUSTOM_REWARD')
        ? 0
        : parseFloat(discountValue) || 0;
      promo.customRewardText = mechanism === 'CUSTOM_REWARD' ? customRewardText : null;
      promo.maxDiscountCap = (hasMaxDiscountCap && mechanism === 'PERCENTAGE')
        ? parseFloat(maxDiscountCap)
        : null;
    }

    if (minSpend !== undefined) promo.minSpend = parseFloat(minSpend) || 0;
    if (totalUsageLimit !== undefined) promo.totalUsageLimit = totalUsageLimit ? parseInt(totalUsageLimit, 10) : null;
    if (perBuyerLimit !== undefined) promo.perBuyerLimit = perBuyerLimit ? parseInt(perBuyerLimit, 10) : 1;

    await promo.save();
    return res.status(200).json({ success: true, message: 'Promo code updated successfully.', promo });
  } catch (error) {
    console.error('Error updating promo code:', error);
    return res.status(500).json({ message: error.message || 'Server error' });
  }
};

// DELETE /api/promos/:id - Delete or deactivate a promo code
exports.deletePromoCode = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const seller = await Seller.findOne({ userId });
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found or unauthorized.' });
    }

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid promo ID.' });
    }

    const promo = await PromoCode.findOneAndDelete({ _id: id, sellerId: seller._id });
    if (!promo) {
      return res.status(404).json({ message: 'Promo code not found or unauthorized' });
    }

    return res.status(200).json({ success: true, message: 'Promo code deleted successfully' });
  } catch (error) {
    console.error('Error deleting promo code:', error);
    return res.status(500).json({ message: 'Failed to delete promo code' });
  }
};