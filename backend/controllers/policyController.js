const sanitizeHtml = require('sanitize-html');
const GuaranteePolicy = require('../models/GuaranteePolicy');
const ShippingPolicy = require('../models/ShippingPolicy');
const Product = require('../models/Product');
const Seller = require('../models/Seller');

const GUARANTEE_TYPES = ['QUALITY_GUARANTEE', 'SELLER_WARRANTY', 'MANUFACTURER_WARRANTY', 'OTHER'];
const GUARANTEE_UNITS = ['day', 'days', 'week', 'weeks', 'month', 'months', 'year', 'years'];
const COVERAGE_MODES = ['NATIONWIDE', 'SELECTED_AREAS', 'LOCAL_DELIVERY', 'PICKUP'];
const RATE_ZONES = ['LOCAL', 'NATIONWIDE', 'PICKUP', 'OTHER'];

const POLICY_TEMPLATES = {
  guarantees: [
    {
      id: 'quality-guarantee', type: 'QUALITY_GUARANTEE', customType: '', duration: 7, durationUnit: 'days',
      description: 'If the product has a manufacturing or quality defect, the customer can request a replacement within 7 days of delivery.', isActive: false
    },
    {
      id: 'seller-warranty', type: 'SELLER_WARRANTY', customType: '', duration: 30, durationUnit: 'days',
      description: 'The seller will help resolve eligible product defects reported within 30 days of delivery according to these terms.', isActive: false
    },
    {
      id: 'manufacturer-warranty', type: 'MANUFACTURER_WARRANTY', customType: '', duration: 1, durationUnit: 'year',
      description: 'Eligible manufacturing defects are covered for 1 year from delivery, subject to the manufacturer warranty terms.', isActive: false
    },
    {
      id: 'other-guarantee', type: 'OTHER', customType: 'Replacement Guarantee', duration: 7, durationUnit: 'days',
      description: 'The customer can request a replacement within 7 days of delivery when the stated replacement conditions are met.', isActive: false
    }
  ],
  shipping: [
    {
      id: 'standard-shipping', name: 'Standard Shipping', coverage: { mode: 'NATIONWIDE', areas: [] },
      rates: [{ zone: 'LOCAL', fee: 150 }, { zone: 'NATIONWIDE', fee: 250 }], shippingFee: 250,
      freeShippingThreshold: null, processingTime: { minDays: 1, maxDays: 2 }, transitTime: { minDays: 2, maxDays: 5 }, isActive: false
    },
    {
      id: 'local-delivery', name: 'Local Delivery', coverage: { mode: 'LOCAL_DELIVERY', areas: [] },
      rates: [{ zone: 'LOCAL', fee: 150 }], shippingFee: 150,
      freeShippingThreshold: null, processingTime: { minDays: 1, maxDays: 2 }, transitTime: { minDays: 1, maxDays: 2 }, isActive: false
    },
    {
      id: 'free-shipping', name: 'Free Shipping', coverage: { mode: 'NATIONWIDE', areas: [] },
      rates: [{ zone: 'NATIONWIDE', fee: 0 }], shippingFee: 0,
      freeShippingThreshold: 5000, processingTime: { minDays: 1, maxDays: 2 }, transitTime: { minDays: 2, maxDays: 5 }, isActive: false
    },
    {
      id: 'custom-shipping', name: 'Custom Shipping', coverage: { mode: 'NATIONWIDE', areas: [] },
      rates: [{ zone: 'NATIONWIDE', fee: 250 }], shippingFee: 250,
      freeShippingThreshold: null, processingTime: { minDays: 1, maxDays: 2 }, transitTime: { minDays: 2, maxDays: 5 }, isActive: false
    }
  ]
};

const getSeller = async (req) => {
  const userId = req.user?.id || req.user?.userId;
  return Seller.findOne({ userId }).select('_id').lean();
};

const numberValue = (value) => {
  if (value === '' || value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const cleanText = (value, maxLength) => sanitizeHtml(String(value || '').trim(), { allowedTags: [], allowedAttributes: {} }).slice(0, maxLength);

const normalizeGuarantee = (body) => {
  const type = String(body.type || '').trim().toUpperCase();
  const duration = numberValue(body.duration);
  const customType = cleanText(body.customType, 120);
  if (!GUARANTEE_TYPES.includes(type)) throw new Error('A valid guarantee type is required.');
  if (type === 'OTHER' && !customType) throw new Error('Custom guarantee type is required when Other is selected.');
  if (duration === null || duration < 0) throw new Error('Duration must be a valid non-negative number.');
  const durationUnit = String(body.durationUnit || '').trim().toLowerCase();
  if (!GUARANTEE_UNITS.includes(durationUnit)) throw new Error('A valid duration unit is required.');
  const description = cleanText(body.description, 2000);
  if (description.length < 10) throw new Error('Guarantee description must explain the seller terms (at least 10 characters).');
  return {
    type,
    customType: type === 'OTHER' ? customType : '',
    duration,
    durationUnit,
    description,
    isActive: body.isActive !== false,
    isDefault: body.isDefault === true
  };
};

const normalizeShipping = (body) => {
  const name = cleanText(body.name, 120);
  const coverage = body.coverage || {};
  const mode = String(coverage.mode || '').trim().toUpperCase();
  const shippingFee = numberValue(body.shippingFee);
  const threshold = numberValue(body.freeShippingThreshold);
  const rawRates = Array.isArray(body.rates) ? body.rates : [];
  const processingTime = body.processingTime || {};
  const transitTime = body.transitTime || {};
  const processingMin = numberValue(processingTime.minDays);
  const processingMax = numberValue(processingTime.maxDays);
  const transitMin = numberValue(transitTime.minDays);
  const transitMax = numberValue(transitTime.maxDays);

  if (!name) throw new Error('Policy name is required.');
  if (!COVERAGE_MODES.includes(mode)) throw new Error('A valid coverage mode is required.');
  if (mode === 'SELECTED_AREAS' && (!Array.isArray(coverage.areas) || coverage.areas.length === 0)) {
    throw new Error('At least one selected area is required.');
  }
  const rates = rawRates.length > 0
    ? rawRates.map(rate => ({ zone: String(rate.zone || '').trim().toUpperCase(), fee: numberValue(rate.fee) }))
    : [{ zone: mode === 'LOCAL_DELIVERY' ? 'LOCAL' : mode === 'PICKUP' ? 'PICKUP' : 'NATIONWIDE', fee: shippingFee }];
  if (rates.length === 0 || rates.some(rate => !RATE_ZONES.includes(rate.zone) || rate.fee === null || rate.fee < 0)) {
    throw new Error('At least one valid non-negative shipping rate is required.');
  }
  if (shippingFee !== null && shippingFee < 0) throw new Error('Shipping fee must be a valid non-negative number.');
  if (threshold !== null && threshold < 0) throw new Error('Free-shipping threshold must be non-negative.');
  if ([processingMin, processingMax, transitMin, transitMax].some(value => value === null || value < 0)) {
    throw new Error('Processing and transit days are required and must be non-negative.');
  }
  if (processingMax < processingMin || transitMax < transitMin) throw new Error('Maximum days cannot be less than minimum days.');

  return {
    name,
    coverage: {
      mode,
      areas: Array.isArray(coverage.areas) ? coverage.areas.map(area => cleanText(area, 120)).filter(Boolean) : []
    },
    rates,
    shippingFee: shippingFee === null ? rates[0].fee : shippingFee,
    freeShippingThreshold: threshold,
    processingTime: { minDays: processingMin, maxDays: processingMax },
    transitTime: { minDays: transitMin, maxDays: transitMax },
    isActive: body.isActive !== false,
    isDefault: body.isDefault === true
  };
};

const clearOtherDefaults = async (Model, sellerId, policyId) => {
  await Model.updateMany(
    { sellerId, _id: { $ne: policyId }, isDefault: true },
    { $set: { isDefault: false } }
  );
};

const listPolicies = (Model) => async (req, res) => {
  try {
    const seller = await getSeller(req);
    if (!seller) return res.status(404).json({ message: 'Seller profile not found' });
    const policies = await Model.find({ sellerId: seller._id }).sort({ createdAt: -1 }).lean();
    res.json(policies);
  } catch (error) {
    console.error('listPolicies error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const createPolicy = (Model, normalizer) => async (req, res) => {
  try {
    const seller = await getSeller(req);
    if (!seller) return res.status(404).json({ message: 'Seller profile not found' });
    const normalized = normalizer(req.body);
    if (normalized.isDefault) await clearOtherDefaults(Model, seller._id, null);
    const policy = await Model.create({ sellerId: seller._id, ...normalized });
    res.status(201).json(policy);
  } catch (error) {
    if (error.name === 'ValidationError' || error.message.includes('required') || error.message.includes('valid') || error.message.includes('Maximum') || error.message.includes('threshold')) {
      return res.status(400).json({ message: error.message });
    }
    console.error('createPolicy error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updatePolicy = (Model, normalizer) => async (req, res) => {
  try {
    const seller = await getSeller(req);
    if (!seller) return res.status(404).json({ message: 'Seller profile not found' });
    const policy = await Model.findOne({ _id: req.params.id, sellerId: seller._id });
    if (!policy) return res.status(404).json({ message: 'Policy not found' });
    const normalized = normalizer(req.body);
    if (normalized.isDefault) await clearOtherDefaults(Model, seller._id, policy._id);
    Object.assign(policy, normalized);
    await policy.save();
    res.json(policy);
  } catch (error) {
    if (error.name === 'ValidationError' || error.message.includes('required') || error.message.includes('valid') || error.message.includes('Maximum') || error.message.includes('threshold')) {
      return res.status(400).json({ message: error.message });
    }
    console.error('updatePolicy error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deletePolicy = (Model, field) => async (req, res) => {
  try {
    const seller = await getSeller(req);
    if (!seller) return res.status(404).json({ message: 'Seller profile not found' });
    const policy = await Model.findOne({ _id: req.params.id, sellerId: seller._id });
    if (!policy) return res.status(404).json({ message: 'Policy not found' });
    const inUse = await Product.exists({ sellerId: seller._id, [field]: policy._id });
    if (inUse) return res.status(409).json({ message: 'This policy is used by a product. Disable it instead of deleting it.' });
    await policy.deleteOne();
    res.json({ message: 'Policy deleted' });
  } catch (error) {
    console.error('deletePolicy error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.listGuaranteePolicies = listPolicies(GuaranteePolicy);
exports.createGuaranteePolicy = createPolicy(GuaranteePolicy, normalizeGuarantee);
exports.updateGuaranteePolicy = updatePolicy(GuaranteePolicy, normalizeGuarantee);
exports.deleteGuaranteePolicy = deletePolicy(GuaranteePolicy, 'guaranteePolicyId');
exports.listShippingPolicies = listPolicies(ShippingPolicy);
exports.createShippingPolicy = createPolicy(ShippingPolicy, normalizeShipping);
exports.updateShippingPolicy = updatePolicy(ShippingPolicy, normalizeShipping);
exports.deleteShippingPolicy = deletePolicy(ShippingPolicy, 'shippingPolicyId');
exports.getPolicyTemplates = (req, res) => res.json(POLICY_TEMPLATES);
exports.GUARANTEE_TYPES = GUARANTEE_TYPES;
exports.COVERAGE_MODES = COVERAGE_MODES;
