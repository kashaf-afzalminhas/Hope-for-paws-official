const nodemailer = require('nodemailer');
require('dotenv').config();


console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASS:', process.env.EMAIL_PASS);
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const mailOptions = {
    from: process.env.EMAIL_USER,
    to: 'sahabnooor193@gmail.com', // replace with a test recipient email
    subject: 'Test Email',
    text: 'This is a test email from Nodemailer'
};

transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
        console.error('Test email error:', error);
    } else {
        console.log('Test email sent:', info.response);
    }
});
