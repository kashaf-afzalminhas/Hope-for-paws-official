const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1,
  },
}, { _id: true });

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    items: [cartItemSchema],
  },
  { timestamps: true }
);

// Virtual to compute total price (requires populated productId)
cartSchema.virtual('totalPrice').get(function () {
  return this.items.reduce((sum, item) => {
    const originalPrice = item.productId?.price || 0;
    const discountPercentage = item.productId?.discountPercentage || 0;

    const discountedPrice =
      originalPrice - (originalPrice * discountPercentage) / 100;

    return sum + discountedPrice * item.quantity;
  }, 0);
});

// Virtual to compute total quantity
cartSchema.virtual('totalQuantity').get(function () {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

// Ensure virtuals are included when converting to JSON
cartSchema.set('toJSON', { virtuals: true });
cartSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Cart', cartSchema);
