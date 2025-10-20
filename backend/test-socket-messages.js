const mongoose = require('mongoose');
const Message = require('./models/message');
const Conversation = require('./models/Conversation');
const User = require('./models/User');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hope-for-paws');
    console.log('MongoDB connected for socket testing');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Test function to simulate message sending
const testSocketMessageFlow = async () => {
  try {
    console.log('🔍 Testing socket message flow...');
    
    // Get a conversation to test with
    const conversation = await Conversation.findOne({}).populate('participants');
    if (!conversation) {
      console.log('❌ No conversations found in database');
      return;
    }
    
    console.log('📋 Found conversation:', {
      id: conversation._id,
      participants: conversation.participants.map(p => ({
        id: p._id,
        username: p.username
      }))
    });
    
    // Get the last few messages
    const messages = await Message.find({ conversationId: conversation._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('senderId', 'username');
    
    console.log('💬 Recent messages:');
    messages.forEach((msg, index) => {
      console.log(`  ${index + 1}. ${msg.senderId?.username || 'Unknown'}: ${msg.text} (${msg.createdAt})`);
    });
    
    console.log('\n✅ Socket message flow test completed');
    console.log('💡 To test real-time messaging:');
    console.log('   1. Open two browser tabs/windows');
    console.log('   2. Log in with different user accounts');
    console.log('   3. Start a conversation between them');
    console.log('   4. Send a message from one tab');
    console.log('   5. Check if it appears immediately in the other tab');
    
  } catch (error) {
    console.error('❌ Error testing socket message flow:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  }
};

// Run the test
if (require.main === module) {
  connectDB().then(() => {
    testSocketMessageFlow();
  });
}

module.exports = { testSocketMessageFlow };
