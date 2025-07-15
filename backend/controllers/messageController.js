const Message = require("../models/message");
const Conversation = require("../models/Conversation");
const mongoose = require("mongoose");

exports.sendMessage = async (req, res) => {
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

    // Emit socket event
    const io = req.app.get('socketio');
    if (io) {
      io.to(conversationId.toString()).emit('newMessage', savedMessage);
    }

    res.status(201).json({ data: savedMessage });
  } catch (err) {
    console.error("Error sending message:", err);
    res.status(500).json({ 
      message: "Failed to send message", 
      error: err.message 
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
      .sort({ timestamp: 1 })
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

