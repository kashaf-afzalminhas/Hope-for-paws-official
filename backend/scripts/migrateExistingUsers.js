const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const migrateExistingUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hope-for-paws');
    console.log('Connected to MongoDB');

    // Find all users without phone verification fields
    const usersToUpdate = await User.find({
      $or: [
        { phoneVerified: { $exists: false } },
        { phoneVerificationCode: { $exists: false } },
        { phoneVerificationCodeExpires: { $exists: false } }
      ]
    });

    console.log(`Found ${usersToUpdate.length} users to update`);

    // Update each user
    for (const user of usersToUpdate) {
      const updateData = {};
      
      if (user.phoneVerified === undefined) {
        updateData.phoneVerified = false;
      }
      
      if (user.phoneVerificationCode === undefined) {
        updateData.phoneVerificationCode = null;
      }
      
      if (user.phoneVerificationCodeExpires === undefined) {
        updateData.phoneVerificationCodeExpires = null;
      }

      await User.findByIdAndUpdate(user._id, updateData);
      console.log(`Updated user: ${user.email}`);
    }

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run migration if this file is executed directly
if (require.main === module) {
  migrateExistingUsers();
}

module.exports = migrateExistingUsers;

