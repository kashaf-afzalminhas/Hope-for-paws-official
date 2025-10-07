const Message = require("../models/message");
const Conversation = require("../models/Conversation");
const mongoose = require("mongoose");

exports.sendMessage = async (req, res) => {
  console.log('📨 sendMessage called with:', req.body);
  let { conversationId, senderId, text } = req.body;

  if (!conversationId || !senderId || !text) {
    return res.status(400).json({ 
      message: "conversationId, senderId, and text are required" 
    });
  }

  try {
    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(conversationId) || 
        !mongoose.Types.ObjectId.isValid(senderId)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    // Check if conversation exists
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // Verify sender is a participant
    const isParticipant = conversation.participants.some(participant => 
      participant.toString() === senderId.toString()
    );
    
    if (!isParticipant) {
      return res.status(403).json({ message: "Sender not in conversation" });
    }

    // Create and save message
    const message = new Message({
      conversationId,
      senderId,
      text,
      readBy: [senderId] // Mark as read by sender
    });

    const savedMessage = await message.save();

    // Update conversation's last message
    conversation.lastMessage = {
      text,
      createdAt: savedMessage.createdAt,
      senderId
    };
    conversation.updatedAt = Date.now();
    await conversation.save();

    // Enhanced socket event emission for real-time notifications
    const io = req.app.get("socketio");
    if (io) {
      console.log('📤 Emitting newMessage to conversation room:', conversationId.toString());
      console.log('📤 Message data:', {
        ...savedMessage.toObject(),
        conversationId: conversationId.toString()
      });
      
      // Create consistent message object
      const messageData = {
        _id: savedMessage._id,
        conversationId: conversationId.toString(),
        senderId: savedMessage.senderId.toString(),
        text: savedMessage.text,
        createdAt: savedMessage.createdAt,
        isDeleted: false
      };
      
      try {
        // Get the conversation to find all participants
        const updatedConversation = await Conversation.findById(conversationId);
        if (updatedConversation) {
          console.log('📤 Conversation participants:', updatedConversation.participants);
          console.log('📤 Total connected sockets:', io.sockets.sockets.size);
          
          // Emit to conversation room for all participants
          const roomSockets = io.sockets.adapter.rooms.get(conversationId.toString());
          console.log('📤 Sockets in conversation room:', roomSockets ? roomSockets.size : 0);
          console.log('📤 Room sockets:', roomSockets ? Array.from(roomSockets) : 'No room found');
          
          io.to(conversationId.toString()).emit("newMessage", messageData);
          console.log('✅ Message emitted successfully to conversation room:', conversationId.toString());
          console.log('✅ Message data:', messageData);
          
          // Also emit to each participant's personal room for backup
          updatedConversation.participants.forEach(participantId => {
            const participantRoomSockets = io.sockets.adapter.rooms.get(participantId.toString());
            console.log('📤 Sockets in participant room:', participantId.toString(), participantRoomSockets ? participantRoomSockets.size : 0);
            io.to(participantId.toString()).emit("newMessage", messageData);
            console.log('📤 Also emitted to participant room:', participantId.toString());
          });
          
          // Emit confirmation to sender's personal room
          io.to(savedMessage.senderId.toString()).emit("messageSent", {
            messageId: savedMessage._id,
            conversationId: conversationId.toString(),
            status: "sent"
          });
        }
      } catch (emitError) {
        console.error('❌ Error emitting socket event:', emitError);
      }
    } else {
      console.warn('⚠️ Socket.io not available for message emission');
    }

    res.status(201).json({ 
      data: savedMessage,
      code: "MESSAGE_SENT"
    });
  } catch (err) {
    console.error("Error sending message:", err);
    res.status(500).json({
      message: "Failed to send message",
      error: err.message,
      code: "INTERNAL_ERROR"
    });
  }
};



exports.getMessages = async (req, res) => {
  const { conversationId } = req.params;

  try {
    // Validate conversation ID
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ message: "Invalid conversation ID" });
    }

    const messages = await Message.find({ conversationId })
      .sort({ createdAt: 1 })
      .populate("readBy", "username email"); // Populate readBy with user details

    res.json(messages);
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).json({ message: "Failed to fetch messages", error: err.message });
  }
};

exports.markMessageAsRead = async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user.id;

  try {
    // Validate message ID
    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ message: "Invalid message ID" });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Add userId to readBy array if not already present
    if (!message.readBy.includes(userId)) {
      message.readBy.push(userId);
      await message.save();
    }

    res.json({ message: "Message marked as read" });
  } catch (err) {
    console.error("Error marking message as read:", err);
    res.status(500).json({ message: "Failed to mark message as read", error: err.message });
  }
};

exports.markConversationAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    // Validate conversation ID
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ message: "Invalid conversation ID" });
    }

    // Update all messages in the conversation that are not sent by the user
    const result = await Message.updateMany(
      {
        conversationId,
        senderId: { $ne: userId },
        readBy: { $ne: userId }
      },
      { $addToSet: { readBy: userId } }
    );

    res.json({ 
      message: "Conversation marked as read",
      modifiedCount: result.modifiedCount
    });
  } catch (err) {
    console.error("Error marking conversation as read:", err);
    res.status(500).json({ message: "Failed to mark conversation as read", error: err.message });
  }
};

