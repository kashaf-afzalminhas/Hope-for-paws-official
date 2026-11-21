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
  validate: { xForwardedForHeader: false, trustProxy: false, keyGeneratorIpFallback: false },
  keyGenerator: (req) => {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.length) return forwarded.split(',')[0].trim();
    return req.ip || req.socket?.remoteAddress || 'anonymous';
  },
});

router.post('/chat', aiLimiter, chat);
router.get('/knowledge', getKnowledge);
router.get('/suggestions', getSuggestions);

module.exports = router;
