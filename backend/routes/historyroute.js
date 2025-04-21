const express = require('express');
const router = express.Router();
const adoptionHistoryController = require('../controllers/historycontroller');


// POST route to add a new adoption history entry
router.post('/', adoptionHistoryController.addAdoptionHistory);

// GET route to fetch all adoption history entries
router.get('/', adoptionHistoryController.getAdoptionHistory);


module.exports = router;