const Conversation = require("../models/Conversation");
const mongoose = require("mongoose");

exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversations = await Conversation.find({
      participants: userId,
    }).sort({ updatedAt: -1 });

    res.json(conversations);
  } catch (err) {
    console.error("Error fetching conversations:", err);
    res.status(500).json({ message: "Failed to fetch conversations" });
  }
};

exports.createConversation = async (req, res) => {
  const { senderId, receiverId } = req.body;
  
  // Validate input more thoroughly
  if (!senderId || !receiverId) {
    return res.status(400).json({ 
      message: "Both senderId and receiverId are required",
      code: "MISSING_IDS"
    });
  }

  if (senderId === receiverId) {
    return res.status(400).json({ 
      message: "Cannot create conversation with yourself",
      code: "SELF_CONVERSATION"
    });
  }

  try {
    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(senderId) || 
        !mongoose.Types.ObjectId.isValid(receiverId)) {
      return res.status(400).json({ 
        message: "Invalid user ID format",
        code: "INVALID_ID_FORMAT"
      });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Use the model method we created
      const existingConversation = await Conversation.findByParticipants(
        senderId, 
        receiverId
      ).session(session);

      if (existingConversation) {
        await session.commitTransaction();
        return res.status(200).json({ 
          data: existingConversation,
          message: "Existing conversation found",
          code: "CONVERSATION_EXISTS"
        });
      }

      const newConversation = new Conversation({
        participants: [senderId, receiverId], // Will be sorted by pre-save hook
        lastMessage: {
          text: "Start a conversation...",
          createdAt: new Date(),
          senderId: null
        }
      });

      await newConversation.save({ session });
      await session.commitTransaction();
      
      return res.status(201).json({ 
        data: newConversation,
        message: "New conversation created",
        code: "CONVERSATION_CREATED"
      });
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  } catch (err) {
    if (err.code === 11000) {
      // If we still hit a duplicate key (should be very rare now)
      const existing = await Conversation.findByParticipants(senderId, receiverId);
      if (existing) {
        return res.status(200).json({
          data: existing,
          message: "Conversation already exists (race condition resolved)",
          code: "RACE_CONDITION_RESOLVED"
        });
      }
    }
    
    console.error("Error in createConversation:", {
      error: err,
      senderId,
      receiverId,
      timestamp: new Date()
    });
    
    res.status(500).json({ 
      message: "Failed to create conversation",
      error: err.message,
      code: "INTERNAL_ERROR"
    });
  }
};

exports.getConversationById = async (req, res) => {
  const { id } = req.params;

  try {
    // Validate the conversation ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid conversation ID" });
    }

    const conversation = await Conversation.findById(id).populate("participants", "-password");
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    res.json(conversation);
  } catch (err) {
    console.error("Error fetching conversation by ID:", err);
    res.status(500).json({ message: "Failed to fetch conversation", error: err.message });
  }
};

exports.getUserConversations = async (req, res) => {
  try {
    const userId = req.params.userId;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    const conversations = await Conversation.find({
      participants: new mongoose.Types.ObjectId(userId),
    }).sort({ updatedAt: -1 }).lean();
    // Enhance conversations with proper lastMessage structure
    const Message = require('../models/message');
    const enhancedConversations = await Promise.all(conversations.map(async conv => {
      if (!conv.lastMessage || typeof conv.lastMessage === 'string') {
        // Get actual last message if empty or string
        const lastMsg = await Message.findOne({ conversationId: conv._id })
          .sort({ createdAt: -1 })
          .lean();
        return {
          ...conv,
          lastMessage: lastMsg ? {
            text: lastMsg.text,
            createdAt: lastMsg.createdAt,
            senderId: lastMsg.senderId
          } : { text: "Start a conversation...", createdAt: conv.updatedAt, senderId: null }
        };
      }
      return conv;
    }));
    res.json({ data: enhancedConversations });
  } catch (err) {
    console.error("Error fetching user conversations:", err);
    res.status(500).json({ message: "Failed to fetch user conversations", error: err.message });
  }
};

exports.getConversationBetweenUsers = async (req, res) => {
  try {
    const { firstUserId, secondUserId } = req.params;
    // Validate input
    if (!firstUserId || !secondUserId) {
      return res.status(400).json({ 
        message: "Both user IDs are required",
        code: "MISSING_IDS"
      });
    }
    // Convert to ObjectId and sort consistently
    const sortedParticipants = [firstUserId, secondUserId]
      .map(id => new mongoose.Types.ObjectId(id))
      .sort((a, b) => a.toString().localeCompare(b.toString()));
    // Find conversation with exactly these 2 participants
    const conversation = await Conversation.findOne({
      participants: { $all: sortedParticipants, $size: 2 }
    });
    if (!conversation) {
      return res.status(404).json({ 
        message: "Conversation not found",
        code: "NOT_FOUND"
      });
    }
    res.json({ 
      data: conversation,
      code: "FOUND"
    });
  } catch (err) {
    console.error('Error in getConversationBetweenUsers:', err);
    res.status(500).json({ 
      message: "Failed to fetch conversation",
      error: err.message,
      code: "INTERNAL_ERROR"
    });
  }
};

