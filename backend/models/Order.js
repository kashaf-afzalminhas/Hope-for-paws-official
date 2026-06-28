const mongoose = require('mongoose');

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
  },
  paymentMethod: { type: String, default: 'card' },
  totals: {
    subtotal: { type: Number, required: true },
    shippingFee: { type: Number, required: true },
    finalTotal: { type: Number, required: true },
  },
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
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
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
