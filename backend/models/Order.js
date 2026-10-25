const mongoose = require('mongoose');
const crypto = require('crypto');
const structuredLocationFields = require('./locationFields');

const orderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', required: true },
  items: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
      title: { type: String, required: true },
      image: { type: String },
      quantity: { type: Number, required: true },
      price: { type: Number, required: true },
    }
  ],
  shippingAddress: {
    fullName: { type: String },
    email: { type: String },
    phone: { type: String },
    street: { type: String },
    city: { type: String },
    province: { type: String },
    postalCode: { type: String },
    ...structuredLocationFields,
  },
  paymentMethod: { type: String, default: 'cod' },
  totals: {
    subtotal: { type: Number, required: true },
    shippingFee: { type: Number, required: true },
    discountAmount: { type: Number, default: 0 },
    finalTotal: { type: Number, required: true },
  },
  promoCode: { type: String, default: null },
  promoId: { type: mongoose.Schema.Types.ObjectId, ref: 'PromoCode', default: null },
  customReward: { type: String, default: null },
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
    default: 'Pending',
  },
  statusHistory: [
    {
      status: { type: String, required: true },
      date: { type: Date, default: Date.now },
      note: { type: String },
    }
  ]
}, { timestamps: true });

// Pre-save hook to generate orderId if not exists
orderSchema.pre('validate', function(next) {
  if (!this.orderId) {
    // Timestamp + cryptographically random suffix, so orders created in the same millisecond don't collide
    const timestamp = Date.now().toString().slice(-6);
    const random = crypto.randomInt(0, 1000000).toString().padStart(6, '0');
    this.orderId = `ORD-${timestamp}${random}`;
  }
  
  if (this.isNew && this.statusHistory.length === 0) {
    this.statusHistory.push({
      status: 'Pending',
      note: 'Order placed successfully'
    });
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
