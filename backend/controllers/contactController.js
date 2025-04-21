const Contact = require('../models/Contact');
const nodemailer = require('nodemailer');

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail', // or another email provider
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

exports.submitContactForm = async (req, res) => {
  const { name, email, message } = req.body;

  try {
    // Save to the database
    const newContact = new Contact({ name, email, message });
    await newContact.save();

    // Set up email options
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.RECIPIENT_EMAIL, // Change this to the email that should receive form submissions
      subject: 'New Contact Form Submission',
      text: `You have a new contact form submission:\n\nName: ${name}\nEmail: ${email}\nMessage: ${message}`
    };

    // Send email
    await transporter.sendMail(mailOptions);

    res.status(201).json({ message: 'Form submitted successfully!' });
  } catch (error) {
    console.error('Error saving contact form or sending email:', error);
    res.status(500).json({ error: 'Failed to submit form' });
  }
};