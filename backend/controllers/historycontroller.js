const AdoptionHistory = require('../models/history');

// Add a new adoption history entry
exports.addAdoptionHistory = async (req, res) => {
    try {
      const { image, animalName, ownerName, age, gender } = req.body;
  
      const newHistory = new AdoptionHistory({
        image,
        animalName,
        ownerName,
        age,
        gender,
      });
  
      await newHistory.save();
      res.status(201).json(newHistory);
    } catch (error) {
      console.error("Error adding adoption history:", error);
      res.status(500).json({ message: 'Error adding adoption history', error });
    }
  };
  
  // Get all adoption history entries
  exports.getAdoptionHistory = async (req, res) => {
    try {
      const history = await AdoptionHistory.find();
      res.status(200).json(history);
    } catch (error) {
      console.error("Error fetching adoption history:", error);
      res.status(500).json({ message: 'Error fetching adoption history', error });
    }
  };