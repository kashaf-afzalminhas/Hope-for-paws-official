const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5']
    },
    comment: {
      type: String,
      required: [true, 'Comment is required'],
      trim: true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters']
    },
    images: {
      type: [String],
      default: []
    }
  },
  { timestamps: true }
);

// One review per product per order — enforced at the database level
reviewSchema.index({ order: 1, product: 1 }, { unique: true });

// Compound index for efficient product-level aggregation queries
reviewSchema.index({ product: 1, createdAt: -1 });

const Review = mongoose.model('Review', reviewSchema);

// One-time migration: the old index allowed only ONE review per order (even with several products).
// Drop it if it still exists; Mongoose creates the new order+product index automatically.
mongoose.connection.once('open', async () => {
  try {
    const indexes = await Review.collection.indexes();
    if (indexes.some((i) => i.name === 'order_1' && i.unique)) {
      await Review.collection.dropIndex('order_1');
      await Review.syncIndexes();
      console.log('Reviews: replaced one-review-per-order index with one-review-per-product');
    }
  } catch (err) {
    if (err.codeName !== 'NamespaceNotFound') console.error('Review index migration failed:', err.message);
  }
});

module.exports = Review;
