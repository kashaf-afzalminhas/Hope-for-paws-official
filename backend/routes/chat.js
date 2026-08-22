const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getRecentChats, deleteConversation } = require('../controllers/chatController');

router.get('/recent', auth, getRecentChats);
router.delete('/:conversationId', auth, deleteConversation);

module.exports = router;