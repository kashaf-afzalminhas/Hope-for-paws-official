const Conversation = require("../models/Conversation");
const User = require("../models/User");
const mongoose = require("mongoose");

const PLACEHOLDER_TEXT = "Start a conversation...";

const getAuthUserId = (req) => {
  const id = req.user?.id || req.user?.userId || req.user?._id;
  return id ? id.toString() : null;
};

exports.getConversations = async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const conversations = await Conversation.find({
      participants: userId,
      "deletedBy.userId": { $ne: new mongoose.Types.ObjectId(userId) }
    }).sort({ updatedAt: -1 });

    res.json(conversations);
  } catch (err) {
    console.error("Error fetching conversations:", err);
    res.status(500).json({ message: "Failed to fetch conversations" });
  }
};

exports.createConversation = async (req, res) => {
  // The logged-in user is always one side of the conversation
  const senderId = getAuthUserId(req);
  const receiverId = req.body?.receiverId ? String(req.body.receiverId) : null;

  if (!senderId || !receiverId) {
    return res.status(400).json({
      message: "receiverId is required",
      code: "MISSING_IDS"
    });
  }
  if (!mongoose.Types.ObjectId.isValid(receiverId)) {
    return res.status(400).json({
      message: "Invalid user ID format",
      code: "INVALID_ID_FORMAT"
    });
  }
  if (senderId === receiverId) {
    return res.status(400).json({
      message: "Cannot create conversation with yourself",
      code: "SELF_CONVERSATION"
    });
  }

  try {
    const receiverExists = await User.exists({ _id: receiverId });
    if (!receiverExists) {
      return res.status(404).json({ message: "User not found", code: "USER_NOT_FOUND" });
    }

    const existingConversation = await Conversation.findByParticipants(senderId, receiverId);
    if (existingConversation) {
      return res.status(200).json({
        data: existingConversation,
        message: "Existing conversation found",
        code: "CONVERSATION_EXISTS"
      });
    }

    // No transaction: the unique participants index + duplicate-key handling below
    // already prevents duplicates, and transactions fail on standalone MongoDB.
    const newConversation = new Conversation({
      participants: [senderId, receiverId], // Sorted by pre-save hook
      lastMessage: {
        text: PLACEHOLDER_TEXT,
        createdAt: new Date(),
        senderId: null
      }
    });
    await newConversation.save();

    return res.status(201).json({
      data: newConversation,
      message: "New conversation created",
      code: "CONVERSATION_CREATED"
    });
  } catch (err) {
    if (err.code === 11000) {
      const existing = await Conversation.findByParticipants(senderId, receiverId);
      if (existing) {
        return res.status(200).json({
          data: existing,
          message: "Conversation already exists (race condition resolved)",
          code: "RACE_CONDITION_RESOLVED"
        });
      }
    }
    console.error("Error in createConversation:", err);
    res.status(500).json({
      message: "Failed to create conversation",
      code: "INTERNAL_ERROR"
    });
  }
};

exports.getConversationById = async (req, res) => {
  const { id } = req.params;
  const userId = getAuthUserId(req);

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid conversation ID" });
    }

    const conversation = await Conversation.findById(id).populate("participants", "username profileImage status lastActive");
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }
    const isMember = conversation.participants.some((p) => p._id.toString() === userId);
    if (!isMember) {
      return res.status(403).json({ message: "You are not part of this conversation" });
    }

    res.json(conversation);
  } catch (err) {
    console.error("Error fetching conversation by ID:", err);
    res.status(500).json({ message: "Failed to fetch conversation" });
  }
};

exports.getUserConversations = async (req, res) => {
  try {
    const userId = req.params.userId;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    // Users can only list their own conversations
    if (userId !== getAuthUserId(req)) {
      return res.status(403).json({ message: "You can only view your own conversations" });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Unread count and last message are computed per conversation with small indexed lookups,
    // instead of loading every message of every conversation.
    const conversations = await Conversation.aggregate([
      { $match: { participants: userObjectId } },
      {
        $addFields: {
          _myDeletedAt: {
            $ifNull: [
              {
                $arrayElemAt: [
                  {
                    $map: {
                      input: {
                        $filter: {
                          input: { $ifNull: ["$deletedBy", []] },
                          as: "d",
                          cond: { $eq: ["$$d.userId", userObjectId] }
                        }
                      },
                      as: "d",
                      in: "$$d.deletedAt"
                    }
                  },
                  0
                ]
              },
              new Date(0)
            ]
          }
        }
      },
      {
        $lookup: {
          from: "messages",
          let: { cid: "$_id", since: "$_myDeletedAt" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$conversationId", "$$cid"] },
                    { $gt: ["$createdAt", "$$since"] },
                    { $ne: ["$senderId", userObjectId] },
                    { $not: [{ $in: [userObjectId, { $ifNull: ["$readBy", []] }] }] }
                  ]
                }
              }
            },
            { $count: "n" }
          ],
          as: "_unread"
        }
      },
      {
        $lookup: {
          from: "messages",
          let: { cid: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$conversationId", "$$cid"] } } },
            { $sort: { createdAt: -1 } },
            { $limit: 1 }
          ],
          as: "_last"
        }
      },
      {
        $addFields: {
          unreadCount: { $ifNull: [{ $arrayElemAt: ["$_unread.n", 0] }, 0] },
          lastMessage: { $arrayElemAt: ["$_last", 0] }
        }
      },
      { $sort: { updatedAt: -1 } },
      { $project: { _unread: 0, _last: 0, _myDeletedAt: 0 } }
    ]);

    const validConversations = conversations.filter(conv => {
      // Hide conversations with no real messages yet
      if (!conv.lastMessage || !conv.lastMessage.text || conv.lastMessage.text === PLACEHOLDER_TEXT) {
        return false;
      }
      // Hide conversations the user deleted, unless a newer message arrived since
      if (Array.isArray(conv.deletedBy)) {
        const userDelete = conv.deletedBy.find(d => d.userId?.toString() === userId);
        if (userDelete && conv.lastMessage.createdAt &&
            new Date(conv.lastMessage.createdAt) <= new Date(userDelete.deletedAt)) {
          return false;
        }
      }
      return true;
    });

    res.json({ data: validConversations });
  } catch (err) {
    console.error("Error fetching user conversations:", err);
    res.status(500).json({ message: "Failed to fetch user conversations" });
  }
};

exports.getConversationBetweenUsers = async (req, res) => {
  try {
    const { firstUserId, secondUserId } = req.params;
    if (!firstUserId || !secondUserId) {
      return res.status(400).json({
        message: "Both user IDs are required",
        code: "MISSING_IDS"
      });
    }
    // Only a participant can look up the conversation
    const me = getAuthUserId(req);
    if (me !== firstUserId && me !== secondUserId) {
      return res.status(403).json({ message: "You can only look up your own conversations" });
    }

    const conversation = await Conversation.findByParticipants(firstUserId, secondUserId);
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
      code: "INTERNAL_ERROR"
    });
  }
};
