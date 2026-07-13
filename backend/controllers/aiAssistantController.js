const aiKnowledgeBase = require('../services/aiKnowledgeBase');
const axios = require('axios');

const OPENROUTER_API_KEY = process.env.Chatbot_key;
const AI_MODEL = process.env.AI_MODEL || 'google/gemini-2.5-flash';
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

const buildMessages = (userMessage, conversationHistory = [], userContext, liveData, pageContext) => {
  const systemPrompt = aiKnowledgeBase.buildSystemPrompt(userContext, liveData);

  const messages = [{ role: 'system', content: systemPrompt }];

  if (pageContext) {
    messages.push({
      role: 'user',
      content: `[System: User is currently on page "${pageContext.page}"${pageContext.route ? ` (route: ${pageContext.route})` : ''}${pageContext.section ? `, section: ${pageContext.section}` : ''}]. Continue the conversation naturally.`,
    });
    messages.push({
      role: 'assistant',
      content: `I can see you're on the ${pageContext.page} page. How can I help?`,
    });
  }

  const recentHistory = conversationHistory.slice(-10);
  for (const msg of recentHistory) {
    messages.push({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content,
    });
  }

  messages.push({ role: 'user', content: userMessage });

  return messages;
};

const callAIAPI = async (messages) => {
  if (!OPENROUTER_API_KEY) {
    console.warn('No Chatbot_key found in .env - using local fallback responses');
    return getLocalResponse(messages);
  }

  try {
    const response = await axios.post(
      OPENROUTER_API_URL,
      {
        model: AI_MODEL,
        messages,
        max_tokens: 600,
        temperature: 0.5,
        top_p: 0.9,
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://hopeforpaws.club',
          'X-Title': 'HopeForPaws AI Assistant',
        },
        timeout: 30000,
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('OpenRouter API error:', error.response?.data || error.message);
    return getLocalResponse(messages);
  }
};

const getLocalResponse = (messages) => {
  const lastMessage = messages[messages.length - 1]?.content?.toLowerCase() || '';

  if (lastMessage.includes('adoption') || lastMessage.includes('adopt') || lastMessage.includes('pet')) {
    return `Browse available pets at /adoption. To list a pet for adoption, go to /create-adoption (sign in required). Track your adoption history at /adoptionhistory.`;
  }

  if (lastMessage.includes('marketplace') || lastMessage.includes('buy') || lastMessage.includes('shop') || lastMessage.includes('product')) {
    return `The marketplace at /marketplace has pet products across Food, Toys, Bedding, Grooming, Health, Accessories, and Walking categories. Sign in required. Add items to your cart at /cart and checkout at /checkout.`;
  }

  if (lastMessage.includes('sell') || lastMessage.includes('seller')) {
    return `To start selling: 1) Go to /seller/onboard to register. 2) Complete your store profile and bank details. 3) Wait for admin verification. 4) Once approved, manage products at /seller/dashboard.`;
  }

  if (lastMessage.includes('chat') || lastMessage.includes('message')) {
    return `Start a chat by visiting /chat or clicking on any user's profile. Your recent conversations are at /chat/recent. Real-time messaging with read receipts.`;
  }

  if (lastMessage.includes('post') || lastMessage.includes('community')) {
    return `Community posts are at /posts. Create your own at /createpost (sign in required). You can like posts and add threaded comments.`;
  }

  if (lastMessage.includes('order')) {
    return `View your purchases at /my-orders. Sellers manage orders at /seller/orders. Orders follow: Pending > Confirmed > Processing > Shipped > Delivered.`;
  }

  if (lastMessage.includes('cart')) {
    return `Your cart is at /cart. You can add items from the marketplace, adjust quantities, and proceed to /checkout for multi-seller split orders.`;
  }

  if (lastMessage.includes('wishlist') || lastMessage.includes('saved')) {
    return `Your saved products are at /wishlist. Toggle items from any product page.`;
  }

  if (lastMessage.includes('account') || lastMessage.includes('profile') || lastMessage.includes('setting')) {
    return `Edit your profile at /profile. Upload a profile image, update your bio, phone number, and city. View your public profile at /profile/public/:userId.`;
  }

  if (lastMessage.includes('admin')) {
    return `Admin dashboard at /admin-dashboard. Manage users, moderate content, review seller applications, and handle reports. Only accessible to admin accounts.`;
  }

  if (lastMessage.includes('sign in') || lastMessage.includes('login') || lastMessage.includes('log in')) {
    return `Sign in at /signin with email/password or Google OAuth. New users can register at /signup. Phone verification is required after registration.`;
  }

  if (lastMessage.includes('sign up') || lastMessage.includes('register') || lastMessage.includes('create account')) {
    return `Create an account at /signup. Choose your role (user, seller, or veterinarian). After registration, verify your email and phone number for full access.`;
  }

  if (lastMessage.includes('password') || lastMessage.includes('reset')) {
    return `Reset your password at /reset-password. Enter your email to receive a verification code, then set a new password.`;
  }

  if (lastMessage.includes('faq') || lastMessage.includes('frequently asked')) {
    return `Frequently asked questions are at /faq. For other inquiries, use the contact form at /contactus.`;
  }

  if (lastMessage.includes('contact') || lastMessage.includes('support') || lastMessage.includes('help')) {
    return `Reach support at /contactus. For common questions, check /faq first.`;
  }

  if (lastMessage.includes('notification')) {
    return `View notifications at /notifications. Mark all as read from the same page. Real-time notifications appear via Socket.IO when you're online.`;
  }

  if (lastMessage.includes('review') || lastMessage.includes('rating')) {
    return `Review a product after your order is delivered. Reviews are at /api/reviews/product/:productId. One review per order, rated 1-5 stars.`;
  }

  if (lastMessage.includes('report')) {
    return `Report a product from its detail page using the report button. Reports are reviewed by admins. Sellers are notified and products auto-hide after 5 reports.`;
  }

  if (lastMessage.includes('hello') || lastMessage.includes('hi') || lastMessage.includes('hey')) {
    return `Hello! I'm the HopeForPaws assistant. I can help with adoption, marketplace, account management, or navigating any feature. What do you need?`;
  }

  if (lastMessage.includes('thank')) {
    return `You're welcome. Let me know if you need anything else.`;
  }

  return `I can help with adoption (/adoption), marketplace (/marketplace), posts (/posts), chat (/chat), orders (/my-orders), account settings (/profile), and more. What are you looking for?`;
};

exports.chat = async (req, res) => {
  try {
    const { message, conversationHistory = [], pageContext = null } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (message.length > 1000) {
      return res.status(400).json({ error: 'Message too long (max 1000 characters)' });
    }

    let userContext = null;
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userContext = await aiKnowledgeBase.getUserContext(decoded.userId || decoded.id);
      } catch (e) {
        // Token invalid or expired - treat as guest
      }
    }

    const liveData = await aiKnowledgeBase.getLiveContextData();
    const messages = buildMessages(message.trim(), conversationHistory, userContext, liveData, pageContext);
    const response = await callAIAPI(messages);

    res.json({
      response,
      userRole: userContext ? (userContext.isAdmin ? 'admin' : userContext.isSeller ? 'seller' : userContext.isVeterinarian ? 'vet' : 'user') : 'guest',
    });
  } catch (error) {
    console.error('AI Assistant error:', error);
    res.status(500).json({ error: 'Failed to process your request. Please try again.' });
  }
};

exports.getKnowledge = async (req, res) => {
  try {
    const [stats, adoptions, products, faqs] = await Promise.all([
      aiKnowledgeBase.getPlatformStats(),
      aiKnowledgeBase.getAvailableAdoptions(5),
      aiKnowledgeBase.getPopularProducts(5),
      aiKnowledgeBase.getFAQs(),
    ]);

    res.json({ stats, adoptions, products, faqs });
  } catch (error) {
    console.error('Knowledge base error:', error);
    res.status(500).json({ error: 'Failed to load knowledge base' });
  }
};

exports.getSuggestions = async (req, res) => {
  try {
    let userContext = null;
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userContext = await aiKnowledgeBase.getUserContext(decoded.userId || decoded.id);
      } catch (e) {
        // Guest
      }
    }

    const suggestions = getSuggestedPrompts(userContext);
    res.json({ suggestions, userRole: userContext ? 'authenticated' : 'guest' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load suggestions' });
  }
};

function getSuggestedPrompts(userContext) {
  const guestSuggestions = [
    'How do I adopt a pet?',
    'How do I create an account?',
    'What is the marketplace?',
    'How do I become a seller?',
  ];

  const userSuggestions = [
    'Show available pets for adoption',
    'How do I create a post?',
    'How do I track my orders?',
    'How do I start chatting?',
  ];

  const sellerSuggestions = [
    'How do I add a product?',
    'How do I manage orders?',
    'How do I view my store stats?',
  ];

  const adminSuggestions = [
    'How do I manage users?',
    'How do I review sellers?',
    'Show platform statistics',
  ];

  if (!userContext) return guestSuggestions;
  if (userContext.isAdmin) return adminSuggestions;
  if (userContext.isSeller) return sellerSuggestions;
  return userSuggestions;
}
