const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const messageController = require('../controllers/messageController');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');

// Middleware to validate ObjectId
const validateObjectId = (req, res, next) => {
  const { conversationId, messageId } = req.params;
  const idToValidate = conversationId || messageId;
  
  if (!mongoose.Types.ObjectId.isValid(idToValidate)) {
    return res.status(400).json({ message: "Invalid ID format" });
  }
  next();
};

// Send a message
// At most 30 messages per minute per user (stops spam floods)
const sendMessageLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  keyGenerator: (req) => (req.user?.id || req.user?.userId ? `user:${req.user.id || req.user.userId}` : ipKeyGenerator(req.ip)),
  message: { message: 'You are sending messages too quickly. Please wait a moment.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/", auth, sendMessageLimiter, messageController.sendMessage);

// Get messages of a specific conversation
router.get("/:conversationId", auth, validateObjectId, messageController.getMessages);

// Mark all messages in a conversation as read (more specific route first)
router.patch('/conversations/:conversationId/read', auth, validateObjectId, messageController.markConversationAsRead);

// Mark a message as read
router.patch('/:messageId/read', auth, validateObjectId, messageController.markMessageAsRead);

module.exports = router;
