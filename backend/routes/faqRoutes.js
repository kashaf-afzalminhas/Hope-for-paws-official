// routes/faq.js
const express = require('express');
const FAQ = require('../models/FAQ');


const FaqController = require('../controllers/faqController');


const router = express.Router();

// GET all FAQs


router.get('/', FaqController.getFAQs);


// Export the router using CommonJS

module.exports = router;
