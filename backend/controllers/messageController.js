const Message = require("../models/message");
const Conversation = require("../models/Conversation");
const mongoose = require("mongoose");
const NotificationService = require("../services/notificationService");
const Seller = require('../models/Seller');
const User = require('../models/User');
const { sendEmail } = require('../routes/mailer');
const emailTemplates = require('../utils/emailTemplates');

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

    // Update conversation atomically to prevent VersionError (optimisticConcurrency)
    const updatedConversation = await Conversation.findByIdAndUpdate(
      conversationId,
      {
        $set: {
          lastMessage: {
            text,
            createdAt: savedMessage.createdAt,
            senderId
          },
          updatedAt: new Date()
        }
      },
      { new: true }
    );

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
<<<<<<< HEAD
=======

          // Send email notifications to other participants
          const notificationServiceInstance =
            global.notificationService || new NotificationService(io);
          updatedConversation.participants.forEach(async (participantId) => {
            if (participantId.toString() !== senderId.toString()) {
              try {
                await notificationServiceInstance.notifyChatMessage(
                  conversationId,
                  savedMessage._id,
                  senderId,
                  text,
                  participantId
                );

                // If recipient is a seller, send an immediate email alert
                try {
                  const sellerProfile = await Seller.findOne({ userId: participantId });
                  if (sellerProfile) {
                    const recipientUser = await User.findById(participantId).select('email username');
                    const senderUser = await User.findById(senderId).select('username');
                    if (recipientUser && recipientUser.email) {
                      const { subject, html } = emailTemplates.buildNotificationEmail({
                        title: `New message from ${senderUser?.username || 'Customer'}`,
                        message: text
                      });
                      await sendEmail(recipientUser.email, subject, `New message: ${text}`, html);
                    }
                  }
                } catch (sellerMailErr) {
                  console.error('Error sending immediate seller chat email:', sellerMailErr);
                }

                console.log('📧 Email notification sent to participant:', participantId);
              } catch (notificationError) {
                console.error('❌ Error sending chat notification:', notificationError);
              }
            }
          });
>>>>>>> origin/sahab
        }
      } catch (emitError) {
        console.error('❌ Error emitting socket event:', emitError);
      }
    }

    // Persist chat notifications even when Socket.IO is disabled (Lambda)
    try {
      const updatedConversation =
        await Conversation.findById(conversationId);
      if (updatedConversation) {
        const notificationServiceInstance =
          global.notificationService || new NotificationService(io);
        for (const participantId of updatedConversation.participants) {
          if (participantId.toString() !== senderId.toString()) {
            try {
              await notificationServiceInstance.notifyChatMessage(
                conversationId,
                savedMessage._id,
                senderId,
                text,
                participantId
              );
            } catch (notificationError) {
              console.error('❌ Error sending chat notification:', notificationError);
            }
          }
        }
      }
    } catch (notificationSetupError) {
      console.error('❌ Error setting up chat notifications:', notificationSetupError);
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
  const userId = req.user?._id || req.user?.id || req.user?.userId;

  try {
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ message: "Invalid conversation ID" });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const query = { conversationId };

    // Filter out messages prior to the user's deletion date
    if (userId && Array.isArray(conversation.deletedBy)) {
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

    const messages = await Message.find(query)
      .sort({ createdAt: 1, timestamp: 1 })
      .populate("readBy", "username email");

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

