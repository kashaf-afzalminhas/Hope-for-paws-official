// controllers/faqController.js
const FAQ = require('../models/FAQ');
const { BUILT_IN_FAQS } = require('../utils/faqData');

const normalize = (text) => String(text || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/**
 * The built-in FAQs (data/faqs.js, grouped by category) plus any extra questions
 * saved in the FAQ collection that aren't already covered.
 */
const getAllFAQs = async () => {
  const known = new Set(BUILT_IN_FAQS.map((f) => normalize(f.question)));
  let extras = [];
  try {
    const saved = await FAQ.find().select('question answer').lean();
    extras = saved
      .filter((f) => f.question && f.answer && !known.has(normalize(f.question)))
      .map((f) => ({ _id: f._id, question: f.question, answer: f.answer, category: 'More questions', categoryId: 'more' }));
  } catch (error) {
    // The built-in FAQs are still returned if the database can't be read
    console.warn('Could not load extra FAQs:', error.message);
  }
  return [...BUILT_IN_FAQS, ...extras];
};

// Get all FAQs
const getFAQs = async (req, res) => {
  try {
    res.status(200).json(await getAllFAQs());
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving FAQs' });
  }
};

module.exports = { getFAQs, getAllFAQs };
