// mailer.js
const transporter = require('../config/emailTransporter');

const sendEmail = async (to, subject, text, html) => {
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to,
      subject,
      text,
      ...(html && { html }),
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