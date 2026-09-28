const PromoCode = require('../models/PromoCode');
const Seller = require('../models/Seller');
const Product = require('../models/Product');

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
    const { code, cartItems = [], currentShippingFee = 0 } = req.body;
    const userId = req.user?.id || req.user?.userId;
    const now = new Date();

    if (!code || !code.trim()) {
      return res.status(400).json({ valid: false, message: 'Please enter a promo code.' });
    }

    const promo = await PromoCode.findOne({ code: code.trim().toUpperCase(), isActive: true });
    if (!promo) {
      return res.status(404).json({
        valid: false,
        message: 'This promo code is invalid, inactive, or does not exist.',
      });
    }

    // 1. Check validity dates
    if (now < promo.startDatetime || now > promo.endDatetime) {
      return res.status(400).json({
        valid: false,
        message: 'This promo code is not active or has already expired.',
      });
    }

    // 2. Check total campaign usage limit
    if (promo.totalUsageLimit !== null && promo.totalRedemptions >= promo.totalUsageLimit) {
      return res.status(400).json({
        valid: false,
        message: 'This promo campaign has reached its redemption limit.',
      });
    }

    // 3. Check per-buyer usage limit
    if (userId) {
      const userRecord = promo.userRedemptions?.find(
        (u) => u.userId && u.userId.toString() === userId.toString()
      );
      if (userRecord && userRecord.count >= promo.perBuyerLimit) {
        return res.status(400).json({
          valid: false,
          message: `You have reached the maximum redemption limit (${promo.perBuyerLimit}x) for this code.`,
        });
      }
    }

    // 4. Find all possible seller IDs (both Seller doc _id and User _id) and storeName for the promo
    let promoSeller = await Seller.findOne({
      $or: [
        { _id: promo.sellerId },
        { userId: promo.sellerId },
        { storeName: promo.sellerStoreName }
      ]
    });

    const validSellerIds = new Set([
      promo.sellerId.toString(),
      promoSeller?._id ? promoSeller._id.toString() : null,
      promoSeller?.userId ? promoSeller.userId.toString() : null
    ].filter(Boolean));

    const promoStoreName = (promo.sellerStoreName || promoSeller?.storeName || '').trim().toLowerCase();

    // 5. Resolve each item from MongoDB by Product ID to get ground truth seller info
    const resolvedItems = [];
    for (const item of cartItems) {
      const prodId = item.productId || item.product?._id || item._id;
      let itemSellerId =
        item.sellerId?._id ||
        item.sellerId ||
        item.product?.sellerId?._id ||
        item.product?.sellerId ||
        item.seller?._id ||
        item.seller;
      let itemCategory = item.category || item.product?.category;
      let itemPrice = Number(item.price) || 0;
      let itemStoreName = '';

      if (prodId) {
        const dbProduct = await Product.findById(prodId);
        if (dbProduct) {
          itemSellerId = itemSellerId || dbProduct.sellerId;
          itemCategory = itemCategory || dbProduct.category;
          if (!itemPrice) itemPrice = dbProduct.price;

          // Lookup seller profile of the product to match store name
          if (dbProduct.sellerId) {
            const productSellerDoc = await Seller.findOne({
              $or: [{ _id: dbProduct.sellerId }, { userId: dbProduct.sellerId }]
            });
            if (productSellerDoc) {
              if (productSellerDoc._id) validSellerIds.add(productSellerDoc._id.toString());
              if (productSellerDoc.userId) validSellerIds.add(productSellerDoc.userId.toString());
              itemStoreName = (productSellerDoc.storeName || '').trim().toLowerCase();
            }
          }
        }
      }

      resolvedItems.push({
        productId: prodId,
        sellerId: itemSellerId ? itemSellerId.toString() : null,
        storeName: itemStoreName,
        category: itemCategory || '',
        price: itemPrice,
        quantity: Number(item.quantity) || 1,
      });
    }

    // 6. Match items if seller ID matches OR store name matches
    const sellerItems = resolvedItems.filter((item) => {
      const idMatches = item.sellerId && validSellerIds.has(item.sellerId);
      const nameMatches = promoStoreName && item.storeName && promoStoreName === item.storeName;
      return idMatches || nameMatches;
    });

    if (sellerItems.length === 0) {
      return res.status(400).json({
        valid: false,
        state: 'Seller Item Missing',
        message: `This promo code is from ${promo.sellerStoreName}. Add products from their store to use this code.`,
      });
    }

    // 6. Check categories if the scope is restricted
    let eligibleItems = sellerItems;
    if (promo.scope === 'SPECIFIC_CATEGORY') {
      eligibleItems = sellerItems.filter((item) =>
        promo.applicableCategories.includes(item.resolvedCategory)
      );

      if (eligibleItems.length === 0) {
        return res.status(400).json({
          valid: false,
          state: 'Wrong Category Items',
          message: `This code is only valid on ${promo.applicableCategories.join(', ')} from ${promo.sellerStoreName}.`,
          qualifyingCategories: promo.applicableCategories,
          sellerStoreName: promo.sellerStoreName,
        });
      }
    }

    // 7. Check minimum spend requirement on eligible items
    const eligibleSubtotal = eligibleItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    if (eligibleSubtotal < promo.minSpend) {
      const diff = (promo.minSpend - eligibleSubtotal).toFixed(2);
      return res.status(400).json({
        valid: false,
        state: 'Threshold Not Met',
        message: `Add Rs. ${diff} more worth of items from ${promo.sellerStoreName} to unlock this code.`,
        qualifyingItems: eligibleItems.map((i) => i.productId),
      });
    }

    // 8. Calculate discounts and rewards
    let discountAmount = 0;
    let waivedShipping = false;
    let customReward = null;

    switch (promo.discountMechanism) {
      case 'PERCENTAGE': {
        let calculated = (eligibleSubtotal * promo.discountValue) / 100;
        if (promo.maxDiscountCap && calculated > promo.maxDiscountCap) {
          calculated = promo.maxDiscountCap;
        }
        discountAmount = Math.min(calculated, eligibleSubtotal);
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
    return res.status(500).json({ message: error.message || 'Server error checking promo code' });
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