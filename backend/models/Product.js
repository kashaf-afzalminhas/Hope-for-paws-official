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

      trim: true

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

    }

  },

  { timestamps: true }

);



// Sync visibility with seller status on save

productSchema.pre('save', async function(next) {

  try {

    const seller = await Seller.findById(this.sellerId).select('status');

    if (!seller) return next(new Error('Seller not found'));

    const active = seller.status !== 'suspended';

    this.isVisible = active;

    this.status = active ? 'active' : 'hidden';

    next();

  } catch (err) {

    next(err);

  }

});



module.exports = mongoose.model('Product', productSchema);