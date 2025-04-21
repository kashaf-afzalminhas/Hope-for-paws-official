// mailer.js
const nodemailer = require('nodemailer');

// Create a transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
  service: 'gmail', // Use your email service (e.g., Gmail, Outlook, etc.)
  auth: {
    user: process.env.GMAIL_USER, // Your email address
    pass: process.env.GMAIL_PASS, // Your email password or app-specific password
  },
});

const sendEmail = async (to, subject, text) => {
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to,
      subject,
      text,
    };
  
    console.log("Mail options:", mailOptions); // Log mail options for debugging
  
    try {
      await transporter.sendMail(mailOptions);
      console.log(`Email sent successfully to ${to}`);
    } catch (error) {
      console.error(`Error sending email to ${to}:`, error);
      throw error; // Re-throw the error to see it in the calling function
    }
  };

module.exports = { sendEmail };