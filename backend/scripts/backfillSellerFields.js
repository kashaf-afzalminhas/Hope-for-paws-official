const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const User = require('../models/User');

(async () => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) throw new Error('MONGO_URI missing');
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    const result = await User.updateMany({}, {
      $set: {
        isSeller: false,
        sellerStatus: 'pending',
        canBuy: true
      },
      $setOnInsert: { sellerSince: null }
    });

    console.log('Users updated:', result.modifiedCount || result.nModified || 0);
    await mongoose.disconnect();
    console.log('Done');
  } catch (err) {
    console.error('Backfill failed:', err.message);
    process.exit(1);
  }
})();
