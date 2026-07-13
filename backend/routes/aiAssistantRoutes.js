const express = require('express');
const router = express.Router();
const { chat, getKnowledge, getSuggestions } = require('../controllers/aiAssistantController');
const rateLimit = require('express-rate-limit');

const aiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30,
  message: { error: 'Too many AI requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/chat', aiLimiter, chat);
router.get('/knowledge', getKnowledge);
router.get('/suggestions', getSuggestions);

module.exports = router;
