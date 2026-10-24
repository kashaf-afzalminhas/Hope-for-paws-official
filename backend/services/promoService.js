const mongoose = require('mongoose');
const PromoCode = require('../models/PromoCode');
const Seller = require('../models/Seller');

// Pakistan Standard Time is UTC+5 all year (no daylight saving)
const PKT_OFFSET = '+05:00';

/**
 * Turns a "YYYY-MM-DD" date from the promo form into the start/end of that day in Pakistan time.
 * Anything else (full ISO strings, Date objects) falls back to normal parsing.
 */
const toPktDayBoundary = (value, endOfDay = false) => {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
    return new Date(`${value.trim()}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}${PKT_OFFSET}`);
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return d;
  // Keep previous behaviour for non date-only inputs
  if (endOfDay) d.setHours(23, 59, 59, 999); else d.setHours(0, 0, 0, 0);
  return d;
};

const normalizeCode = (code) => (typeof code === 'string' ? code.trim().toUpperCase() : null);

// Looks up an active promo by its code. Non-string codes (e.g. {"$ne": null}) are rejected.
const findActivePromoByCode = async (code) => {
  const normalized = normalizeCode(code);
  if (!normalized || !/^[A-Z0-9]{1,32}$/.test(normalized)) return null;
  return PromoCode.findOne({ code: normalized, isActive: true });
};

// IDs that identify the promo's own store (the Seller _id, and the seller's User _id for older data)
const getPromoSellerIds = async (promo) => {
  const ids = new Set([promo.sellerId.toString()]);
  const promoSeller = await Seller.findOne({
    $or: [{ _id: promo.sellerId }, { userId: promo.sellerId }]
  }).select('_id userId');
  if (promoSeller) {
    ids.add(promoSeller._id.toString());
    if (promoSeller.userId) ids.add(promoSeller.userId.toString());
  }
  return ids;
};

/**
 * Checks a promo against server-side items and calculates the discount.
 * items: [{ productId, sellerId, category, price (unit price from DB), quantity }]
 * Returns { valid: true, discountAmount, waivedShipping, customReward, eligibleItems }
 *      or { valid: false, status, message, state?, extra? }
 */
const evaluatePromo = async ({ promo, items, userId, now = new Date() }) => {
  if (!promo || !promo.isActive) {
    return { valid: false, status: 404, message: 'This promo code is invalid, inactive, or does not exist.' };
  }
  if (now < promo.startDatetime || now > promo.endDatetime) {
    return { valid: false, status: 400, message: 'This promo code is not active or has already expired.' };
  }
  if (promo.totalUsageLimit !== null && promo.totalUsageLimit !== undefined &&
      promo.totalRedemptions >= promo.totalUsageLimit) {
    return { valid: false, status: 400, message: 'This promo campaign has reached its redemption limit.' };
  }
  if (userId) {
    const userRecord = promo.userRedemptions?.find(
      (u) => u.userId && u.userId.toString() === userId.toString()
    );
    const buyerLimit = promo.perBuyerLimit || 1;
    if (userRecord && userRecord.count >= buyerLimit) {
      return {
        valid: false,
        status: 400,
        message: `You have reached the maximum redemption limit (${buyerLimit}x) for this code.`
      };
    }
  }

  // Only items sold by the promo's own store qualify
  const promoSellerIds = await getPromoSellerIds(promo);
  const sellerItems = items.filter((i) => i.sellerId && promoSellerIds.has(i.sellerId.toString()));
  if (sellerItems.length === 0) {
    return {
      valid: false,
      status: 400,
      state: 'Seller Item Missing',
      message: `This promo code is from ${promo.sellerStoreName}. Add products from their store to use this code.`
    };
  }

  let eligibleItems = sellerItems;
  if (promo.scope === 'SPECIFIC_CATEGORY') {
    const allowed = (promo.applicableCategories || []).map((c) => c.trim().toLowerCase());
    eligibleItems = sellerItems.filter((i) => allowed.includes((i.category || '').trim().toLowerCase()));
    if (eligibleItems.length === 0) {
      return {
        valid: false,
        status: 400,
        state: 'Wrong Category Items',
        message: `This code is only valid on ${promo.applicableCategories.join(', ')} from ${promo.sellerStoreName}.`,
        extra: { qualifyingCategories: promo.applicableCategories, sellerStoreName: promo.sellerStoreName }
      };
    }
  }

  const eligibleSubtotal = eligibleItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  if (eligibleSubtotal < promo.minSpend) {
    const diff = (promo.minSpend - eligibleSubtotal).toFixed(2);
    return {
      valid: false,
      status: 400,
      state: 'Threshold Not Met',
      message: `Add Rs. ${diff} more worth of items from ${promo.sellerStoreName} to unlock this code.`,
      extra: { qualifyingItems: eligibleItems.map((i) => i.productId) }
    };
  }

  let discountAmount = 0;
  let waivedShipping = false;
  let customReward = null;
  switch (promo.discountMechanism) {
    case 'PERCENTAGE': {
      let calculated = (eligibleSubtotal * promo.discountValue) / 100;
      if (promo.maxDiscountCap && calculated > promo.maxDiscountCap) calculated = promo.maxDiscountCap;
      discountAmount = Math.min(calculated, eligibleSubtotal);
      break;
    }
    case 'FIXED_AMOUNT':
      discountAmount = Math.min(promo.discountValue, eligibleSubtotal);
      break;
    case 'FREE_SHIPPING':
      waivedShipping = true;
      break;
    case 'CUSTOM_REWARD':
      customReward = promo.customRewardText;
      break;
    default:
      break;
  }
  // Whole rupees, never negative
  discountAmount = Math.max(0, Math.round(discountAmount));

  return { valid: true, discountAmount, waivedShipping, customReward, eligibleItems };
};

/**
 * Atomically records one use of the promo (campaign total + this buyer's count).
 * Returns true if the use was recorded, false if a limit was reached in the meantime.
 */
const reservePromoUsage = async (promo, userId) => {
  const totalCondition = {
    $or: [
      { totalUsageLimit: null },
      { $expr: { $lt: ['$totalRedemptions', '$totalUsageLimit'] } }
    ]
  };
  const reserved = await PromoCode.findOneAndUpdate(
    { _id: promo._id, isActive: true, ...totalCondition },
    { $inc: { totalRedemptions: 1 } },
    { new: true }
  );
  if (!reserved) return false;

  if (!userId) return true;
  const uid = new mongoose.Types.ObjectId(String(userId));
  const limit = promo.perBuyerLimit || 1;

  // Existing buyer record below the limit -> increment it
  let ok = await PromoCode.updateOne(
    { _id: promo._id, userRedemptions: { $elemMatch: { userId: uid, count: { $lt: limit } } } },
    { $inc: { 'userRedemptions.$.count': 1 } }
  );
  if (ok.modifiedCount === 0) {
    // No record yet -> add one (only if still absent)
    ok = await PromoCode.updateOne(
      { _id: promo._id, 'userRedemptions.userId': { $ne: uid } },
      { $push: { userRedemptions: { userId: uid, count: 1 } } }
    );
  }
  if (ok.modifiedCount === 0) {
    // Another request added the record at the same moment: try the increment once more
    ok = await PromoCode.updateOne(
      { _id: promo._id, userRedemptions: { $elemMatch: { userId: uid, count: { $lt: limit } } } },
      { $inc: { 'userRedemptions.$.count': 1 } }
    );
  }
  if (ok.modifiedCount === 0) {
    // Buyer limit reached: undo the campaign increment
    await PromoCode.updateOne({ _id: promo._id }, { $inc: { totalRedemptions: -1 } });
    return false;
  }
  return true;
};

// Gives back one use of the promo (used when an order is cancelled or checkout fails)
const releasePromoUsage = async ({ promoId, code, sellerId }, userId) => {
  // Older orders only stored the code: match it together with the order's store
  const filter = promoId ? { _id: promoId } : (code ? { code, ...(sellerId ? { sellerId } : { isActive: true }) } : null);
  if (!filter) return;
  await PromoCode.updateOne({ ...filter, totalRedemptions: { $gt: 0 } }, { $inc: { totalRedemptions: -1 } });
  if (userId) {
    const uid = new mongoose.Types.ObjectId(String(userId));
    await PromoCode.updateOne(
      { ...filter, userRedemptions: { $elemMatch: { userId: uid, count: { $gt: 0 } } } },
      { $inc: { 'userRedemptions.$.count': -1 } }
    );
  }
};

module.exports = {
  toPktDayBoundary,
  findActivePromoByCode,
  evaluatePromo,
  reservePromoUsage,
  releasePromoUsage
};
