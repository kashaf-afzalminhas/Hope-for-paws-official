const express = require('express');
const { submitContactForm } = require('../controllers/contactController');

const router = express.Router();

// POST request to handle contact form submission
router.post('/contact', submitContactForm);

module.exports = router;
