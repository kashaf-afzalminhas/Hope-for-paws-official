const ShippingPolicy = require('../models/ShippingPolicy');
const GuaranteePolicy = require('../models/GuaranteePolicy');

async function resolveEffectivePolicy({ product, field, Model }) {
  const explicitId = product[field]?._id || product[field];
  const sellerId = product.sellerId?._id || product.sellerId;
  if (explicitId) {
    const policy = await Model.findOne({ _id: explicitId, sellerId }).lean();
    return { policy: policy?.isActive ? policy : null, explicitlyAssigned: true };
  }

  const policy = await Model.findOne({ sellerId, isDefault: true, isActive: true })
    .sort({ updatedAt: -1, createdAt: -1 })
    .lean();
  return { policy: policy || null, explicitlyAssigned: false };
}

const resolveEffectiveShippingPolicy = (product) => resolveEffectivePolicy({
  product,
  field: 'shippingPolicyId',
  Model: ShippingPolicy
});

const resolveEffectiveGuaranteePolicy = (product) => resolveEffectivePolicy({
  product,
  field: 'guaranteePolicyId',
  Model: GuaranteePolicy
});

module.exports = {
  resolveEffectiveShippingPolicy,
  resolveEffectiveGuaranteePolicy
};