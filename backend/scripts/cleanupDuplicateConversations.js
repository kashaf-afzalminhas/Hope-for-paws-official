const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');
const Message = require('../models/message');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hope-for-paws');
    console.log('MongoDB connected for cleanup');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const cleanupDuplicateConversations = async () => {
  try {
    console.log('Starting duplicate conversation cleanup...');

    // Find all conversations
    const conversations = await Conversation.find({}).lean();
    console.log(`Found ${conversations.length} total conversations`);

    // Group conversations by sorted participants
    const conversationGroups = new Map();

    conversations.forEach(conv => {
      if (conv.participants && conv.participants.length === 2) {
        const sortedParticipants = conv.participants
          .map(id => id.toString())
          .sort()
          .join('-');
        
        if (!conversationGroups.has(sortedParticipants)) {
          conversationGroups.set(sortedParticipants, []);
        }
        conversationGroups.get(sortedParticipants).push(conv);
      }
    });

    console.log(`Found ${conversationGroups.size} unique participant pairs`);

    let mergedCount = 0;
    let deletedCount = 0;

    // Process each group
    for (const [participantPair, convs] of conversationGroups) {
      if (convs.length > 1) {
        console.log(`\nProcessing group with ${convs.length} conversations for participants: ${participantPair}`);
        
        // Sort conversations by updatedAt to keep the most recent one
        convs.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        
        const keepConversation = convs[0]; // Keep the most recent one
        const deleteConversations = convs.slice(1); // Delete the rest
        
        console.log(`Keeping conversation: ${keepConversation._id}`);
        console.log(`Deleting conversations: ${deleteConversations.map(c => c._id).join(', ')}`);
        
        // Move all messages from deleted conversations to the kept conversation
        for (const deleteConv of deleteConversations) {
          // Update all messages to point to the kept conversation
          await Message.updateMany(
            { conversationId: deleteConv._id },
            { conversationId: keepConversation._id }
          );
          
          // Delete the duplicate conversation
          await Conversation.findByIdAndDelete(deleteConv._id);
          deletedCount++;
        }
        
        mergedCount++;
      }
    }

    console.log(`\nCleanup completed!`);
    console.log(`- Merged ${mergedCount} groups of duplicate conversations`);
    console.log(`- Deleted ${deletedCount} duplicate conversations`);
    console.log(`- Moved all messages to the most recent conversation in each group`);

  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  }
};

// Run the cleanup
if (require.main === module) {
  connectDB().then(() => {
    cleanupDuplicateConversations();
  });
}

module.exports = { cleanupDuplicateConversations }; 