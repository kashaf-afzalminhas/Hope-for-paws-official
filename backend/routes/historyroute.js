const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const AdoptionHistory = require('../models/adoptionHistoryModel');

// Get user's adoption history
router.get('/adoptions/history', auth, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    console.log('Fetching history for user:', userId);
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const history = await AdoptionHistory.find({ userId })
      .select('petName petType petImage requestDate status')
      .sort({ requestDate: -1 });
    
    console.log('Found history entries:', history.length);

    if (!history || history.length === 0) {
      return res.status(200).json([]);
    }

    res.status(200).json(history);
  } catch (error) {
    console.error('Error fetching adoption history:', error);
    res.status(500).json({ 
      message: 'Server error while fetching adoption history',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;