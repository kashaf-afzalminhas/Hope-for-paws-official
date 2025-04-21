const mongoose = require('mongoose');
const FAQ = require('./models/FAQ');
require('dotenv').config();

const faqs = [
    {
        question: "What is the adoption process?",
        answer:
          "The adoption process begins by browsing our website to find pets that are available for adoption. When you find a pet you’re interested in, you can contact the pet owner directly through their ad to discuss adoption details. We recommend having an initial conversation to understand the pet’s needs and to arrange a meeting if both parties agree.",
      },
      {
        question: "How much does it cost to adopt a pet?",
        answer:
          "HopeforPaws support free pet adoption and discourage any kind of fee charges.",
      },
      {
        question: "What if I have questions about my pet’s health?",
        answer:
          "If you have questions about your pet’s health, you should consult a veterinarian",
      },
      {
        question: "How do I care for my newly adopted pet?",
        answer:
          "Caring for a new pet involves providing a proper diet, regular exercise, socialization, and veterinary care.",
      },
      {
        question: "How do I know if a pet is right for me?",
        answer:
          "We encourage potential adopters to spend time with the animal before adopting.",
      },
      {
        question: "What should I consider before adopting a pet?",
        answer:
          "Consider your lifestyle, living situation, and the time and resources you can dedicate to a pet. It’s important to choose an animal that fits well with your family and environment.",
      },
      {
        question: "What is HopeforPaws?",
        answer:
          "HopeforPaws is an organization dedicated to rescuing animals in need and facilitating their adoption into loving homes. We also provide resources for pet care and healthcare.",
      },
      {
        question: "What should I do if I find a stray animal?",
        answer:
          "If you find a stray animal, you can try to safely contain it and check for identification. If you cannot safely do so, contact your local animal control or a nearby shelter for assistance.",
      },
      {
        question: "How do I report an animal in distress or an emergency?",
        answer:
          "If you see an animal in distress, please contact your local animal control or a nearby shelter immediately. You can also reach out to us through our website for clinics & vets information",
      },
      {
        question: "Can I adopt if I have other pets at home?",
        answer:
          "Yes, but we recommend a meet-and-greet with your current pets to ensure compatibility before finalizing the adoption.",
      },
    ];

const seedFAQs = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
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
