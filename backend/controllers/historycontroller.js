const AdoptionHistory = require('../models/adoptionHistoryModel');

// Get user's adoption history
exports.getUserAdoptionHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    const history = await AdoptionHistory.find({ userId })
      .populate('petId', 'name petType imageUrl status')
      .populate('requestId', 'status message createdAt')
      .sort({ createdAt: -1 });

    if (!history || history.length === 0) {
      return res.status(404).json({ message: 'No adoption history found for this user' });
    }

    res.status(200).json(history);
  } catch (error) {
    console.error("Error fetching user adoption history:", error);
    res.status(500).json({ 
      message: 'Server error',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Add a new adoption history entry
exports.addAdoptionHistory = async (req, res) => {
  try {
    const { 
      userId, 
      petId, 
      requestId, 
      petName, 
      petType, 
      petImage, 
      message,
      adopterName,
      adopterEmail,
      adopterPhone
    } = req.body;

    // Validate required fields
    if (!userId || !petId || !requestId || !petName || !petType || !petImage) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const newHistory = new AdoptionHistory({
      userId,
      petId,
      requestId,
      petName,
      petType,
      petImage,
      message,
      adopterName,
      adopterEmail,
      adopterPhone
    });

    await newHistory.save();
    res.status(201).json(newHistory);
  } catch (error) {
    console.error("Error adding adoption history:", error);
    res.status(500).json({ 
      message: 'Error adding adoption history',
      error: error.message 
    });
  }
};

module.exports = exports;