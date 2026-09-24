const PromoCode = require('../models/PromoCode');
const Seller = require('../models/Seller');

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

    const startDatetime = new Date(startDate);
    startDatetime.setHours(0, 0, 0, 0);

    const endDatetime = new Date(endDate);
    endDatetime.setHours(23, 59, 59, 999);

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
    const { code, cartItems, currentShippingFee = 0 } = req.body;
    const userId = req.user?.id || req.user?.userId;
    const now = new Date();

    if (!code || !code.trim()) {
      return res.status(400).json({ valid: false, message: 'Please provide a promo code.' });
    }

    const promo = await PromoCode.findOne({ code: code.trim().toUpperCase(), isActive: true });
    if (!promo) {
      return res.status(404).json({
        valid: false,
        state: 'Expired / Inactive',
        message: 'This promo code has expired or is not yet valid.',
      });
    }

    if (now < promo.startDatetime || now > promo.endDatetime) {
      return res.status(400).json({
        valid: false,
        state: 'Expired / Inactive',
        message: 'This promo code has expired or is not yet valid.',
      });
    }

    if (promo.totalUsageLimit !== null && promo.totalRedemptions >= promo.totalUsageLimit) {
      return res.status(400).json({
        valid: false,
        message: 'This promo campaign has reached its redemption limit.',
      });
    }

    if (userId) {
      const userRecord = promo.userRedemptions.find((u) => u.userId.toString() === userId.toString());
      if (userRecord && userRecord.count >= promo.perBuyerLimit) {
        return res.status(400).json({
          valid: false,
          message: `You have reached the maximum redemption limit (${promo.perBuyerLimit}x) for this code.`,
        });
      }
    }

    // Partition items under promo seller
    const sellerItems = (cartItems || []).filter(
      (item) => item.sellerId && item.sellerId.toString() === promo.sellerId.toString()
    );

    if (sellerItems.length === 0) {
      return res.status(400).json({
        valid: false,
        state: 'Seller Item Missing',
        message: `This code is from ${promo.sellerStoreName}. Add products from their store to use this code.`,
      });
    }

    let eligibleItems = sellerItems;
    if (promo.scope === 'SPECIFIC_CATEGORY') {
      eligibleItems = sellerItems.filter((item) =>
        promo.applicableCategories.includes(item.category)
      );

      if (eligibleItems.length === 0) {
        return res.status(400).json({
          valid: false,
          state: 'Wrong Category Items',
          message: `This code is only valid for ${promo.applicableCategories.join(', ')} items from ${promo.sellerStoreName}.`,
          qualifyingCategories: promo.applicableCategories,
          sellerStoreName: promo.sellerStoreName,
        });
      }
    }

    const eligibleSubtotal = eligibleItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    if (eligibleSubtotal < promo.minSpend) {
      const diff = (promo.minSpend - eligibleSubtotal).toFixed(2);
      return res.status(400).json({
        valid: false,
        state: 'Threshold Not Met',
        message: `Add Rs. ${diff} more of qualifying items from ${promo.sellerStoreName} to unlock this code.`,
        qualifyingItems: eligibleItems.map((i) => i.productId),
      });
    }

    let discountAmount = 0;
    let waivedShipping = false;
    let customReward = null;

    switch (promo.discountMechanism) {
      case 'PERCENTAGE': {
        let raw = (eligibleSubtotal * promo.discountValue) / 100;
        if (promo.maxDiscountCap && raw > promo.maxDiscountCap) {
          raw = promo.maxDiscountCap;
        }
        discountAmount = Math.min(raw, eligibleSubtotal);
        break;
      }
      case 'FIXED_AMOUNT': {
        discountAmount = Math.min(promo.discountValue, eligibleSubtotal);
        break;
      }
      case 'FREE_SHIPPING': {
        waivedShipping = true;
        break;
      }
      case 'CUSTOM_REWARD': {
        customReward = promo.customRewardText;
        break;
      }
    }

    return res.status(200).json({
      valid: true,
      state: 'Code Valid & Applied',
      message: `✓ "${promo.code}" applied! You saved Rs. ${discountAmount.toFixed(2)} on ${promo.sellerStoreName} items.`,
      code: promo.code,
      discountAmount,
      waivedShipping,
      customReward,
      sellerId: promo.sellerId.toString(),
      eligibleProductIds: eligibleItems.map((i) => i.productId),
    });
  } catch (error) {
    console.error('applyPromoCode error:', error);
    return res.status(500).json({ message: error.message || 'Server error' });
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
      const startDatetime = new Date(startDate);
      startDatetime.setHours(0, 0, 0, 0);
      promo.startDatetime = startDatetime;
    }

    if (endDate) {
      const endDatetime = new Date(endDate);
      endDatetime.setHours(23, 59, 59, 999);
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