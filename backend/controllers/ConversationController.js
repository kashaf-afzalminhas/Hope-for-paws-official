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
  
  console.log('createConversation endpoint called');
  console.log('Request body:', req.body);
  console.log('Sender ID:', senderId);
  console.log('Receiver ID:', receiverId);

  try {
    // Validate senderId and receiverId
    if (!mongoose.Types.ObjectId.isValid(senderId) || !mongoose.Types.ObjectId.isValid(receiverId)) {
      console.log('Invalid user IDs:', { senderId, receiverId });
      return res.status(400).json({ message: "Invalid user IDs" });
    }

    // Always sort participants to ensure uniqueness
    const sortedParticipants = [senderId, receiverId].sort();

    // Check for existing conversation
    let conversation = await Conversation.findOne({
      participants: sortedParticipants,
    });

    if (conversation) {
      return res.status(200).json({ data: conversation, message: "Using existing conversation" });
    }

    // Create new conversation with lastMessage as object
    conversation = new Conversation({
      participants: sortedParticipants,
      lastMessage: { text: "Start a conversation...", createdAt: new Date(), senderId: null },
    });
    await conversation.save();
    res.status(201).json({ data: conversation });
  } catch (err) {
    // Handle duplicate key error
    if (err.code === 11000) {
      // Fetch the existing conversation and return it
      const sortedParticipants = [senderId, receiverId].sort();
      const conversation = await Conversation.findOne({ participants: sortedParticipants });
      return res.status(200).json({ data: conversation, message: "Using existing conversation (duplicate key)" });
    }
    console.error("Error creating conversation:", err);
    res.status(500).json({ message: "Failed to start conversation", error: err.message });
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
    if (!firstUserId || !secondUserId) {
      return res.status(400).json({ message: "Both user IDs are required" });
    }
    console.log('getConversationBetweenUsers endpoint called');
    console.log('Request params:', req.params);
    console.log('First user ID:', firstUserId);
    console.log('Second user ID:', secondUserId);
    // Always sort participants for uniqueness
    const sortedParticipants = [firstUserId, secondUserId].sort();
    const conversation = await Conversation.findOne({
      participants: sortedParticipants,
    });
    console.log('Found conversation:', conversation);
    if (!conversation) {
      console.log('No conversation found, returning 404');
      return res.status(404).json({ message: "Conversation not found" });
    }
    res.json({ data: conversation });
  } catch (err) {
    console.error('Error fetching conversation between users:', err);
    res.status(500).json({ message: "Failed to fetch conversation", error: err.message });
  }
};

