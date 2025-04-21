// /routes/adoptreqroute.js
const express = require('express');
const router = express.Router();
const AdoptReq = require('../models/adoptreq'); // Import the AdoptReq model

// Route to handle POST requests to create an adoption request
router.post('/', async (req, res) => {
    // Destructure data from the request body
    const { fname, lname, animal, owner, address, number, cnic, reason } = req.body;

    // Validate the data (check if all fields are provided)
    if (!fname || !lname || !animal || !owner || !address || !number || !cnic || !reason) {
        return res.status(400).json({ error: "All fields are required" });
    }

    // Create a new adoption request entry
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

    // Save the new adoption request to the database
    try {
        await newAdoptReq.save();
        res.status(201).json({ message: 'Request submitted successfully' });
    } catch (err) {
        console.error("Error while processing adoption request:", err);
        res.status(500).json({ error: 'Server Error' });
    }
});

// Export the router to be used in your main app
module.exports = router;
