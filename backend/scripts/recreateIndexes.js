const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hope-for-paws');
    console.log('MongoDB connected for index recreation');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const recreateIndexes = async () => {
  try {
    console.log('Starting index recreation...');

    // Drop all existing indexes on the conversations collection
    console.log('Dropping existing indexes...');
    await Conversation.collection.dropIndexes();
    console.log('All indexes dropped');

    // Recreate the indexes
    console.log('Creating new indexes...');
    
    // Create the main unique index on participants
    await Conversation.collection.createIndex(
      { participants: 1 }, 
      { 
        unique: true,
        collation: { locale: 'en', strength: 2 }
      }
    );
    console.log('Created main participants unique index');

    // Create additional indexes for better performance
    await Conversation.collection.createIndex({ updatedAt: -1 });
    console.log('Created updatedAt index');

    await Conversation.collection.createIndex({ "participants": 1 });
    console.log('Created participants index for queries');

    console.log('\nIndex recreation completed successfully!');

  } catch (error) {
    console.error('Error during index recreation:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  }
};

// Run the index recreation
if (require.main === module) {
  connectDB().then(() => {
    recreateIndexes();
  });
}

module.exports = { recreateIndexes }; 