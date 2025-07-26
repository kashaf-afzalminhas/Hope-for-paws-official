const express = require("express");
const router = express.Router();
const conversationController = require("../controllers/ConversationController");
const mongoose = require("mongoose");

// Middleware to validate ObjectId
const validateObjectId = (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid ID format" });
  }
  next();
};

// Middleware to validate user IDs in params
const validateUserIds = (req, res, next) => {
  const { firstUserId, secondUserId, userId } = req.params;
  const idsToValidate = [firstUserId, secondUserId, userId].filter(Boolean);
  
  for (const id of idsToValidate) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }
  }
  next();
};

// Create a new conversation
router.post("/", conversationController.createConversation);

// Get all conversations for a specific user
router.get("/:userId", validateUserIds, conversationController.getUserConversations);

// Get a specific conversation between two users
router.get("/find/:firstUserId/:secondUserId", validateUserIds, conversationController.getConversationBetweenUsers);

// Get a conversation by its ID
router.get("/conversation/:id", validateObjectId, conversationController.getConversationById);

module.exports = router;