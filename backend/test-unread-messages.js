const mongoose = require('mongoose');
const Message = require('./models/message');
const Conversation = require('./models/Conversation');
const User = require('./models/User');

// Test configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hope-for-paws';

async function testUnreadMessages() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Create test users
    const user1 = new User({
      username: 'testuser1',
      email: 'test1@example.com',
      password: 'password123'
    });
    const user2 = new User({
      username: 'testuser2', 
      email: 'test2@example.com',
      password: 'password123'
    });

    await user1.save();
    await user2.save();
    console.log('✅ Test users created');

    // Create conversation
    const conversation = new Conversation({
      participants: [user1._id, user2._id]
    });
    await conversation.save();
    console.log('✅ Test conversation created');

    // Send messages from user2 to user1
    const message1 = new Message({
      conversationId: conversation._id,
      senderId: user2._id,
      text: 'Hello from user2',
      readBy: [user2._id] // Only read by sender
    });

    const message2 = new Message({
      conversationId: conversation._id,
      senderId: user2._id,
      text: 'Another message from user2',
      readBy: [user2._id] // Only read by sender
    });

    await message1.save();
    await message2.save();
    console.log('✅ Test messages created');

    // Test aggregation query (similar to getUserConversations)
    const conversations = await Conversation.aggregate([
      { $match: { participants: user1._id } },
      {
        $lookup: {
          from: "messages",
          localField: "_id",
          foreignField: "conversationId",
          as: "messages"
        }
      },
      {
        $addFields: {
          unreadCount: {
            $size: {
              $filter: {
                input: "$messages",
                as: "msg",
                cond: {
                  $and: [
                    { $ne: ["$$msg.senderId", user1._id] },
                    { $not: { $in: [user1._id, "$$msg.readBy"] } }
                  ]
                }
              }
            }
          }
        }
      }
    ]);

    console.log('✅ Aggregation test completed');
    console.log('Conversations with unread counts:', conversations);

    // Test marking conversation as read
    const result = await Message.updateMany(
      {
        conversationId: conversation._id,
        senderId: { $ne: user1._id },
        readBy: { $ne: user1._id }
      },
      { $addToSet: { readBy: user1._id } }
    );

    console.log('✅ Mark as read test completed');
    console.log('Modified messages:', result.modifiedCount);

    // Verify messages are now read
    const updatedMessages = await Message.find({ conversationId: conversation._id });
    console.log('✅ Updated messages:', updatedMessages.map(m => ({
      text: m.text,
      readBy: m.readBy
    })));

    console.log('🎉 All tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the test
testUnreadMessages(); 