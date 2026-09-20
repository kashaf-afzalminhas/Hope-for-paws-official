const Product = require('../models/Product');
const { resolveEffectiveShippingPolicy } = require('./policyService');

class ShippingCalculationError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
    this.status = 400;
  }
}

const normalize = (value) => String(value || '').trim().toLocaleLowerCase();
const normalizeZone = (value) => normalize(value).toUpperCase();
const isPakistan = (value) => ['pakistan', 'pk', 'pkr'].includes(normalize(value));

const resolveZone = (policy, destination = {}) => {
  const mode = normalizeZone(policy.coverage?.mode);
  const requestedPickup = normalize(destination.fulfillmentMethod) === 'pickup';

  if (mode === 'PICKUP') {
    if (!requestedPickup) {
      throw new ShippingCalculationError('PICKUP_REQUIRED', 'This seller only offers pickup for the selected items.');
    }
    return 'PICKUP';
  }

  if (requestedPickup) {
    throw new ShippingCalculationError('PICKUP_UNAVAILABLE', 'Pickup is not available for this seller.');
  }

  if (mode === 'LOCAL_DELIVERY') return 'LOCAL';

  if (mode === 'SELECTED_AREAS') {
    const destinationAreas = [destination.city, destination.province, destination.region, destination.state]
      .map(normalize)
      .filter(Boolean);
    const areas = (policy.coverage?.areas || []).map(normalize).filter(Boolean);
    if (destinationAreas.length === 0 || !destinationAreas.some(area => areas.includes(area))) {
      throw new ShippingCalculationError('DESTINATION_UNSUPPORTED', 'This seller does not ship to the selected city or area.');
    }
  }

  return 'NATIONWIDE';
};

const getRate = (policy, zone) => {
  const rates = Array.isArray(policy.rates) ? policy.rates : [];
  const configured = rates.find(rate => normalizeZone(rate.zone) === normalizeZone(zone));
  if (configured && Number.isFinite(Number(configured.fee)) && Number(configured.fee) >= 0) {
    return Number(configured.fee);
  }

  if (rates.length === 0 && policy.shippingFee !== null && policy.shippingFee !== undefined && Number(policy.shippingFee) >= 0) {
    return Number(policy.shippingFee);
  }

  throw new ShippingCalculationError('RATE_UNAVAILABLE', 'Shipping cannot currently be calculated for this seller.');
};

const calculateSellerShipping = async ({ sellerId, items, destination, qualifyingSubtotal }) => {
  const productIds = items.map(item => item.productId || item.product?._id).filter(Boolean);
  if (productIds.length === 0) {
    throw new ShippingCalculationError('ITEMS_REQUIRED', 'No shippable items were provided.');
  }
  if (!isPakistan(destination?.country)) {
    throw new ShippingCalculationError('COUNTRY_UNSUPPORTED', 'Shipping is currently available within Pakistan only.');
  }
  if (!destination?.city && normalize(destination?.fulfillmentMethod) !== 'pickup') {
    throw new ShippingCalculationError('DESTINATION_REQUIRED', 'A delivery city is required to calculate shipping.');
  }

  const products = await Product.find({ _id: { $in: productIds }, sellerId })
    .select('shippingPolicyId sellerId')
    .lean();
  if (products.length !== productIds.length) {
    throw new ShippingCalculationError('PRODUCT_UNAVAILABLE', 'One or more products are no longer available for shipping.');
  }

  const effectivePolicies = await Promise.all(products.map(resolveEffectiveShippingPolicy));
  if (effectivePolicies.some(({ explicitlyAssigned, policy }) => explicitlyAssigned && !policy)) {
    throw new ShippingCalculationError('POLICY_INACTIVE', 'Shipping cannot currently be calculated because an assigned shipping policy is inactive.');
  }

  const policies = effectivePolicies.map(({ policy }) => policy).filter(Boolean);
  const policyIds = [...new Set(policies.map(policy => policy._id.toString()))];
  if (policies.length === 0) {
    throw new ShippingCalculationError('POLICY_REQUIRED', 'Shipping cannot currently be calculated for this seller.');
  }
  if (policyIds.length > 1) {
    throw new ShippingCalculationError('POLICY_CONFLICT', 'The selected products use different shipping policies and cannot be shipped together yet.');
  }

  const policy = policies[0];

  const zone = resolveZone(policy, destination);
  const baseFee = getRate(policy, zone);
  const subtotal = Number(qualifyingSubtotal);
  const freeShipping = policy.freeShippingThreshold !== null
    && policy.freeShippingThreshold !== undefined
    && Number.isFinite(subtotal)
    && subtotal >= Number(policy.freeShippingThreshold);
  const threshold = policy.freeShippingThreshold === null || policy.freeShippingThreshold === undefined
    ? null
    : Number(policy.freeShippingThreshold);
  const freeShippingAmountRemaining = threshold === null || freeShipping
    ? 0
    : Math.max(0, threshold - subtotal);

  return {
    sellerId: sellerId.toString(),
    policyId: policy._id,
    policySnapshot: {
      name: policy.name,
      coverage: policy.coverage,
      rates: policy.rates,
      shippingFee: policy.shippingFee,
      freeShippingThreshold: policy.freeShippingThreshold,
      processingTime: policy.processingTime,
      transitTime: policy.transitTime
    },
    zone,
    subtotal,
    shippingFee: freeShipping ? 0 : baseFee,
    baseFee,
    freeShipping,
    freeShippingThreshold: threshold,
    freeShippingAmountRemaining,
    estimatedDelivery: {
      minDays: Number(policy.processingTime.minDays) + Number(policy.transitTime.minDays),
      maxDays: Number(policy.processingTime.maxDays) + Number(policy.transitTime.maxDays)
    }
  };
};

module.exports = {
  ShippingCalculationError,
  calculateSellerShipping,
  resolveZone,
  getRate,
  isPakistan
};
