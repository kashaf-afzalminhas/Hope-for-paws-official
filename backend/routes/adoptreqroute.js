// /routes/adoptreqroute.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const AdoptReq = require('../models/adoptreq'); // Import the AdoptReq model
const adoptreqcontroller = require('../controllers/adoptreqcontroller');

// Configure Cloudinary
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

// Configure Multer
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Route to handle POST requests to create an adoption request
router.post('/', upload.single('petHistoryImage'), async (req, res) => {
    // Destructure data from the request body
    const { fname, lname, animal, owner, address, number, cnic, reason } = req.body;

    // Validate the data (check if all fields are provided)
    if (!fname || !lname || !animal || !owner || !address || !number || !cnic || !reason) {
        return res.status(400).json({ error: "All fields are required" });
    }

    // Check if image was uploaded
    if (!req.file) {
        return res.status(400).json({ error: "Pet history image is required" });
    }

    try {
        // Upload image to Cloudinary
        const b64 = Buffer.from(req.file.buffer).toString('base64');
        const dataURI = `data:${req.file.mimetype};base64,${b64}`;
        const uploadResponse = await cloudinary.uploader.upload(dataURI);

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
            petHistoryImage: uploadResponse.secure_url
        });

        // Save the new adoption request to the database
        await newAdoptReq.save();
        res.status(201).json({ message: 'Request submitted successfully' });
    } catch (err) {
        console.error("Error while processing adoption request:", err);
        res.status(500).json({ error: 'Server Error' });
    }
});

// Route to handle adoption request submissions using controller
router.post('/controller', upload.single('petHistoryImage'), async (req, res) => {
    try {
        // Upload image to Cloudinary if provided
        let petHistoryImage = '';
        if (req.file) {
            const b64 = Buffer.from(req.file.buffer).toString('base64');
            const dataURI = `data:${req.file.mimetype};base64,${b64}`;
            const uploadResponse = await cloudinary.uploader.upload(dataURI);
            petHistoryImage = uploadResponse.secure_url;
        }

        // Add the image URL to the request body
        req.body.petHistoryImage = petHistoryImage;
        
        // Call the controller
        await adoptreqcontroller.createAdoptionRequest(req, res);
    } catch (error) {
        console.error('Error in adoption request route:', error);
        res.status(500).json({ error: 'Server Error' });
    }
});

// Export the router to be used in your main app
module.exports = router;
