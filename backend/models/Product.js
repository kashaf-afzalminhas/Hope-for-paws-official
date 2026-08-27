const mongoose = require('mongoose');

const Seller = require('./Seller');



const productSchema = new mongoose.Schema(

  {

    sellerId: {

      type: mongoose.Schema.Types.ObjectId,

      ref: 'Seller',

      required: true,

      index: true

    },

    title: {

      type: String,

      required: true,

      trim: true

    },

    description: {

      type: String,

      default: ''

    },

    price: {

      type: Number,

      required: true,

      min: 0

    },

    // ✅ NEW FIELD: Category

    category: {
      type: String,
      required: true,
      enum: ['Food', 'Toys', 'Bedding', 'Grooming', 'Health & Medicine', 'Accessories', 'Walking'],
      trim: true
    },
    brand: {
      type: String,
      required: true,
      trim: true
    },
    sku: {
      type: String,
      required: true,
      uppercase: true,
      trim: true
    },

    discountPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    
    additionalInfo: {
      type: [{
        heading: { type: String, trim: true },
        description: { type: String, trim: true }
      }],
      validate: [(val) => val.length <= 5, '{PATH} exceeds the limit of 5 custom fields']
    },

    // ✅ NEW FIELD: Stock (Matches your frontend code)

    countInStock: {

      type: Number,

      required: true,

      min: 0,

      default: 0

    },

    images: {

      type: [String],

      default: []

    },

    isVisible: {

      type: Boolean,

      default: true

    },

    status: {

      type: String,

      enum: ['active', 'hidden'],

      default: 'active'

    },

    // ✅ Cached review statistics (updated by reviewController after each review)
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    numReviews: {
      type: Number,
      default: 0,
      min: 0
    },

    shareCount: {
      type: Number,
      default: 0,
      min: 0
    },

    // Automated Moderation Engine Fields
    reportCount: {
      type: Number,
      default: 0
    },
    isHidden: {
      type: Boolean,
      default: false
    }

  },

  { timestamps: true }
);

// ✅ Add Compound Unique Indexes
productSchema.index({ sellerId: 1, sku: 1 }, { unique: true });
productSchema.index({ sellerId: 1, title: 1 }, { unique: true });



// Sync visibility with seller status on save

productSchema.pre('save', async function(next) {

  try {
    const seller = await Seller.findById(this.sellerId).select('status');
    if (!seller) return next(new Error('Seller not found'));

    if (seller.status === 'suspended') {
      this.isVisible = false;
      this.status = 'hidden';
    } else {
      // Seller is active. Visibility is determined by product status.
      // Default new products to active if not explicitly set
      if (!this.status) this.status = 'active';
      this.isVisible = this.status === 'active';
    }
    next();

  } catch (err) {

    next(err);

  }

});



module.exports = mongoose.model('Product', productSchema);