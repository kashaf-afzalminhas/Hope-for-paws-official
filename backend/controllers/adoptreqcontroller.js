const AdoptReq = require('../models/adoptreq');
const AdoptionHistory = require('../models/history'); // Import AdoptionHistory model

// Controller for handling adoption requests and saving to history
exports.createAdoptionRequest = async (req, res) => {
  try {
    const { fname, lname, animal, owner, address, number, cnic, reason } = req.body;

    // Save the adoption request
    const newAdoptReq = new AdoptReq({
      fname,
      lname,
      animal,
      owner,
      address,
      number,
      cnic,
      reason,
    });

    await newAdoptReq.save();

    // Save relevant data to AdoptionHistory
    const newHistory = new AdoptionHistory({
      image: '', // Add an image field if needed or leave empty
      animalName: animal,
      ownerName: owner, // Combine first and last name for owner
      age: 'N/A', // Optional: Replace with actual age if available
      gender: 'N/A', // Optional: Replace with actual gender if available
      status: 'Pending', // Default status
    });
    console.log('Saving to history:', newHistory);
    await newHistory.save();

    res.status(201).json({ message: 'Adoption request submitted and history updated successfully!' });
  } catch (error) {
    console.error('Error creating adoption request:', error);
    res.status(500).json({ error: 'Server Error' });
  }
};
