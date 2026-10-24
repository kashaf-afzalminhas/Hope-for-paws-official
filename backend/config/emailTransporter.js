const nodemailer = require('nodemailer');

// Port 587 + STARTTLS — `service: 'gmail'` (implicit SSL on 465) fails on Node 24+ OpenSSL.
// SMTP_PORT=465 can be used on networks that block 587 (465 uses direct SSL).
const smtpPort = Number(process.env.SMTP_PORT) || 587;
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: smtpPort,
  secure: smtpPort === 465,
  requireTLS: smtpPort !== 465,
  // Fail fast instead of hanging the signup request when SMTP is unreachable.
  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 20000,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

module.exports = transporter;
