const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const messageController = require('../controllers/messageController');
const mongoose = require('mongoose');

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
router.post("/", messageController.sendMessage);

// Get messages of a specific conversation
router.get("/:conversationId", auth, validateObjectId, messageController.getMessages);

// Mark all messages in a conversation as read (more specific route first)
router.patch('/conversations/:conversationId/read', auth, validateObjectId, messageController.markConversationAsRead);

// Mark a message as read
router.patch('/:messageId/read', auth, validateObjectId, messageController.markMessageAsRead);

module.exports = router;
