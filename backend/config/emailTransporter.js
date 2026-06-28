const nodemailer = require('nodemailer');

// Port 587 + STARTTLS — `service: 'gmail'` (implicit SSL on 465) fails on Node 24+ OpenSSL.
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

module.exports = transporter;
