// controllers/faqController.js
const FAQ = require('../models/FAQ');

// Get all FAQs
exports.getFAQs = async (req, res) => {
  try {
    const faqs = await FAQ.find();
    res.status(200).json(faqs);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving FAQs', error });
  }
};
