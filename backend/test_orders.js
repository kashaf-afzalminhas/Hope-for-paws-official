const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Order = require('./models/Order');
const Seller = require('./models/Seller');

async function test() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');
    
    // We don't have a specific userId, let's just find one seller
    const seller = await Seller.findOne();
    console.log('Found seller:', seller ? seller._id : 'none');
    
    if (seller) {
      const queryConditions = [{ sellerId: seller.userId }];
      queryConditions.push({ sellerId: seller._id });
      console.log('Query:', JSON.stringify({ $or: queryConditions }));
      
      const orders = await Order.find({ $or: queryConditions }).sort({ createdAt: -1 });
      console.log('Orders found:', orders.length);
    }
  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    mongoose.disconnect();
  }
}
test();
