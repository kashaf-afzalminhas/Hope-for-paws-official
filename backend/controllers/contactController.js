const Contact = require('../models/Contact');
const transporter = require('../config/emailTransporter');
const emailTemplates = require('../utils/emailTemplates');

exports.submitContactForm = async (req, res) => {
  const { name, email, message } = req.body;

  // Debug: Check if email credentials are available
  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
    console.error('Missing email credentials:', {
      GMAIL_USER: !!process.env.GMAIL_USER,
      GMAIL_PASS: !!process.env.GMAIL_PASS
    });
    return res.status(500).json({ error: 'Email service not configured properly' });
  }

  try {
    // Save to the database
    const newContact = new Contact({ name, email, message });
    await newContact.save();

    // Send email
    const { subject, html } = emailTemplates.buildContactFormEmail({ name, email, message });
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: process.env.GMAIL_USER,
      subject,
      html,
    });

    res.status(201).json({ message: 'Form submitted successfully!' });
  } catch (error) {
    console.error('Error saving contact form or sending email:', error);
    
    // Provide more specific error messages
    if (error.code === 'EAUTH') {
      res.status(500).json({ error: 'Email authentication failed. Please check email configuration.' });
    } else if (error.name === 'ValidationError') {
      res.status(400).json({ error: 'Invalid form data provided.' });
    } else {
      res.status(500).json({ error: 'Failed to submit form. Please try again later.' });
    }
  }
};