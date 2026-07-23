// Preview script — generates a sample email HTML and opens it in the browser.
// Run: node utils/previewEmail.js
const { buildVerificationEmail } = require('./emailTemplates');
const fs = require('fs');
const path = require('path');

const html = buildVerificationEmail({
  code: 'a1b2c3',
  heading: 'Verification Code',
  message: 'Use this code to verify your account and complete your registration.',
  expiry: '2 minutes',
  preheader: 'Your Hope for Paws verification code is a1b2c3',
});

const outPath = path.join(__dirname, '..', 'email_preview.html');
fs.writeFileSync(outPath, html, 'utf-8');
console.log(`✅ Preview written to: ${outPath}`);
console.log('Open that file in your browser to see the email template.');
