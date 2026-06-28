require('dotenv').config();

// Log environment variables (without showing the actual values)
console.log('GMAIL_USER is set:', !!process.env.GMAIL_USER);
console.log('GMAIL_PASS is set:', !!process.env.GMAIL_PASS);

const transporter = require('./config/emailTransporter');

// Test email
const mailOptions = {
  from: process.env.GMAIL_USER,
  to: process.env.GMAIL_USER, // Send to yourself for testing
  subject: 'Test Email from HopeForPaws',
  text: 'This is a test email to verify email configuration.',
};

// Send email
transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    console.error('Error sending test email:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack
    });
  } else {
    console.log('Test email sent successfully:', info.response);
  }
}); 