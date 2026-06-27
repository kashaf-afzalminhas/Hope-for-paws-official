const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
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
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    province: { type: String, required: true },
    postalCode: { type: String, required: true },
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['cod', 'card'],
  },
  totals: {
    subtotal: { type: Number, required: true },
    shippingFee: { type: Number, required: true },
    finalTotal: { type: Number, required: true },
  },
  status: {
    type: String,
    default: 'Pending',
  }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
