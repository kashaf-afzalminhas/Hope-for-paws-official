const Contact = require('../models/Contact');
const nodemailer = require('nodemailer');

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail', // or another email provider
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
});

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

    // Set up email options
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: process.env.GMAIL_USER, // Send to the same email address for now
      subject: 'New Contact Form Submission',
      text: `You have a new contact form submission:\n\nName: ${name}\nEmail: ${email}\nMessage: ${message}`
    };

    // Send email
    await transporter.sendMail(mailOptions);

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