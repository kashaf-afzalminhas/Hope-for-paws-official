const mongoose = require('mongoose');
const FAQ = require('./models/FAQ');
require('dotenv').config();

// The FAQ page always shows the built-in questions from utils/faqData.js.
// This script copies them into the database (replacing what is there), e.g. for tools that read the FAQ collection.
const { BUILT_IN_FAQS } = require('./utils/faqData');
const faqs = BUILT_IN_FAQS.map(({ question, answer }) => ({ question, answer }));

const seedFAQs = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    await FAQ.deleteMany({});
    await FAQ.insertMany(faqs);
    console.log("FAQs seeded successfully!");
  } catch (error) {
    console.error("Error seeding FAQs:", error);
  } finally {
    mongoose.connection.close();
  }
};

seedFAQs();
