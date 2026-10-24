const Message = require("../models/message");
const Conversation = require("../models/Conversation");
const mongoose = require("mongoose");
const NotificationService = require("../services/notificationService");
const Seller = require('../models/Seller');
const User = require('../models/User');
const { sendEmail } = require('../routes/mailer');
const emailTemplates = require('../utils/emailTemplates');

const MAX_MESSAGE_LENGTH = 5000;
const DEFAULT_MESSAGE_PAGE = 200;
const MAX_MESSAGE_PAGE = 500;
// Minimum gap between immediate "new message" emails to the same seller.
// Tracked in memory so it doesn't interfere with the reminder queue's lastChatEmailSentAt cooldown.
const SELLER_EMAIL_COOLDOWN_MS = 15 * 60 * 1000;
const lastSellerEmailAt = new Map(); // sellerUserId -> timestamp

const getAuthUserId = (req) => {
  const id = req.user?.id || req.user?.userId || req.user?._id;
  return id ? id.toString() : null;
};

const isParticipant = (conversation, userId) =>
  Array.isArray(conversation?.participants) &&
  conversation.participants.some((p) => p.toString() === userId.toString());

// Immediate email to a seller, respecting their email preference and a cooldown
const sendSellerChatEmail = async (participantId, senderId, text) => {
  const sellerProfile = await Seller.findOne({ userId: participantId }).select('_id').lean();
  if (!sellerProfile) return;

  const key = participantId.toString();
  if (Date.now() - (lastSellerEmailAt.get(key) || 0) < SELLER_EMAIL_COOLDOWN_MS) return;

  const recipientUser = await User.findById(participantId)
    .select('email username notificationPreferences');
  if (!recipientUser || !recipientUser.email) return;
  // Only sellers who chose instant emails get them immediately (daily summary / disabled are respected)
  const preference = recipientUser.notificationPreferences?.email || 'instant';
  if (preference !== 'instant') return;

  lastSellerEmailAt.set(key, Date.now());

  const senderUser = await User.findById(senderId).select('username').lean();
  const { subject, html } = emailTemplates.buildNotificationEmail({
    title: `New message from ${senderUser?.username || 'Customer'}`,
    message: text
  });
  await sendEmail(recipientUser.email, subject, `New message: ${text}`, html);
};

exports.sendMessage = async (req, res) => {
  // The sender is always the logged-in user; any senderId in the body is ignored
  const senderId = getAuthUserId(req);
  const { conversationId } = req.body || {};
  const rawText = req.body?.text;

  if (!senderId) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  if (!conversationId || typeof rawText !== 'string') {
    return res.status(400).json({ message: "conversationId and text are required" });
  }

  const text = rawText.trim();
  if (!text) {
    return res.status(400).json({ message: "Message cannot be empty" });
  }
  if (text.length > MAX_MESSAGE_LENGTH) {
    return res.status(400).json({ message: `Message is too long (max ${MAX_MESSAGE_LENGTH} characters)` });
  }

  try {
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }
    if (!isParticipant(conversation, senderId)) {
      return res.status(403).json({ message: "You are not part of this conversation" });
    }

    const message = new Message({
      conversationId,
      senderId,
      text,
      readBy: [senderId] // Mark as read by sender
    });
    const savedMessage = await message.save();

    // Update conversation atomically to prevent VersionError (optimisticConcurrency)
    await Conversation.findByIdAndUpdate(conversationId, {
      $set: {
        lastMessage: { text, createdAt: savedMessage.createdAt, senderId },
        updatedAt: new Date()
      }
    });

    const io = req.app.get("socketio");
    if (io) {
      const messageData = {
        _id: savedMessage._id,
        conversationId: conversationId.toString(),
        senderId: savedMessage.senderId.toString(),
        text: savedMessage.text,
        createdAt: savedMessage.createdAt,
        isDeleted: false
      };

      try {
        // One emit to the conversation room plus each participant's personal room.
        // Socket.IO delivers it once per socket even if a socket is in several of these rooms.
        const rooms = [conversationId.toString(), ...conversation.participants.map((p) => p.toString())];
        io.to(rooms).emit("newMessage", messageData);

        io.to(senderId).emit("messageSent", {
          messageId: savedMessage._id,
          conversationId: conversationId.toString(),
          status: "sent"
        });
      } catch (emitError) {
        console.error('Error emitting chat message:', emitError);
      }

      // In-app notification + reminder email scheduling for the other participant(s)
      const notificationServiceInstance = global.notificationService || new NotificationService(io);
      conversation.participants
        .filter((p) => p.toString() !== senderId)
        .forEach(async (participantId) => {
          try {
            await notificationServiceInstance.notifyChatMessage(
              conversationId,
              savedMessage._id,
              senderId,
              text,
              participantId
            );
          } catch (notificationError) {
            console.error('Error sending chat notification:', notificationError);
          }
          try {
            await sendSellerChatEmail(participantId, senderId, text);
          } catch (sellerMailErr) {
            console.error('Error sending seller chat email:', sellerMailErr);
          }
        });
    }

    res.status(201).json({
      data: savedMessage,
      code: "MESSAGE_SENT"
    });
  } catch (err) {
    console.error("Error sending message:", err);
    res.status(500).json({
      message: "Failed to send message",
      code: "INTERNAL_ERROR"
    });
  }
};

exports.getMessages = async (req, res) => {
  const { conversationId } = req.params;
  const userId = getAuthUserId(req);

  try {
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ message: "Invalid conversation ID" });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }
    if (!userId || !isParticipant(conversation, userId)) {
      return res.status(403).json({ message: "You are not part of this conversation" });
    }

    const query = { conversationId };

    // Filter out messages prior to the user's deletion date
    if (Array.isArray(conversation.deletedBy)) {
      const userDeleteRecord = conversation.deletedBy.find(
        d => d.userId?.toString() === userId.toString()
      );
      if (userDeleteRecord && userDeleteRecord.deletedAt) {
        const deleteDate = new Date(userDeleteRecord.deletedAt);
        query.$or = [
          { createdAt: { $gt: deleteDate } },
          { timestamp: { $gt: deleteDate } }
        ];
      }
    }

    // Paging: newest messages first from the database, returned oldest-first.
    // ?before=<ISO date> loads older messages; ?limit= (default 200, max 500).
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || DEFAULT_MESSAGE_PAGE, 1), MAX_MESSAGE_PAGE);
    if (typeof req.query.before === 'string' && req.query.before) {
      const beforeDate = new Date(req.query.before);
      if (Number.isNaN(beforeDate.getTime())) {
        return res.status(400).json({ message: "Invalid 'before' date" });
      }
      query.createdAt = { ...(query.createdAt || {}), $lt: beforeDate };
    }

    const newestFirst = await Message.find(query)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit)
      .populate("readBy", "username");

    res.set('X-Has-More', newestFirst.length === limit ? 'true' : 'false');
    res.json(newestFirst.reverse());
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).json({ message: "Failed to fetch messages" });
  }
};

exports.markMessageAsRead = async (req, res) => {
  const { messageId } = req.params;
  const userId = getAuthUserId(req);

  try {
    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ message: "Invalid message ID" });
    }

    const message = await Message.findById(messageId).select('conversationId');
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    const conversation = await Conversation.findById(message.conversationId).select('participants');
    if (!conversation || !isParticipant(conversation, userId)) {
      return res.status(403).json({ message: "You are not part of this conversation" });
    }

    await Message.updateOne({ _id: messageId }, { $addToSet: { readBy: userId } });

    res.json({ message: "Message marked as read" });
  } catch (err) {
    console.error("Error marking message as read:", err);
    res.status(500).json({ message: "Failed to mark message as read" });
  }
};

exports.markConversationAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = getAuthUserId(req);

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ message: "Invalid conversation ID" });
    }

    const conversation = await Conversation.findById(conversationId).select('participants');
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }
    if (!userId || !isParticipant(conversation, userId)) {
      return res.status(403).json({ message: "You are not part of this conversation" });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const result = await Message.updateMany(
      {
        conversationId,
        senderId: { $ne: userObjectId },
        readBy: { $ne: userObjectId }
      },
      { $addToSet: { readBy: userObjectId } }
    );

    // Let the user's other tabs/devices update their unread badges
    if (result.modifiedCount > 0) {
      const io = req.app.get("socketio");
      if (io) io.to(userId).emit("conversationRead", { conversationId: String(conversationId) });
    }

    res.json({
      message: "Conversation marked as read",
      modifiedCount: result.modifiedCount
    });
  } catch (err) {
    console.error("Error marking conversation as read:", err);
    res.status(500).json({ message: "Failed to mark conversation as read" });
  }
};
