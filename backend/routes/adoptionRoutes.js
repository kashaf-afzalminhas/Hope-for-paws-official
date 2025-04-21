const express = require('express');
const router = express.Router();
const Adoption = require('../models/adoptionModel');
const AdoptionRequest = require('../models/adoptionRequestModel'); // You'll need to create this model
const auth = require('../middleware/auth');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const mongoose = require('mongoose');
const AdoptionHistory = require('../models/adoptionHistoryModel');
const User = require('../models/User');

// Configure Multer
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Create an adoption post
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    const { name, age, petType, description } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'Image is required' });
    }

    // Upload image to Cloudinary
    const b64 = Buffer.from(req.file.buffer).toString('base64');
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;
    const uploadResponse = await cloudinary.uploader.upload(dataURI);

    const adoptionPost = new Adoption({
      userId: req.user.userId,
      name,
      age,
      petType,
      description,
      imageUrl: uploadResponse.secure_url,
      status: 'available' // Default status
    });

    await adoptionPost.save();
    res.status(201).json(adoptionPost);
  } catch (error) {
    console.error('Error creating adoption post:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all adoption posts
router.get('/', async (req, res) => {
  try {
    // Remove the status filter to show all posts
    const adoptionPosts = await Adoption.find()
      .populate('userId', 'username')
      .sort({ createdAt: -1 });
    res.json(adoptionPosts);
  } catch (error) {
    console.error('Error fetching adoption posts:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get adoption posts for a specific user
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const userId = String(req.params.userId);
    const authUserId = String(req.user.userId);
    
    if (userId !== authUserId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const adoptionPosts = await Adoption.find({
      $or: [
        { userId: req.params.userId },
        { userId: new mongoose.Types.ObjectId(req.params.userId) }
      ]
    })
    .populate('userId', 'username')
    .sort({ createdAt: -1 });

    res.json(adoptionPosts);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a single adoption post
router.get('/:id', async (req, res) => {
  try {
    const adoptionPost = await Adoption.findById(req.params.id)
      .populate('userId', 'username');

    if (!adoptionPost) {
      return res.status(404).json({ message: 'Adoption post not found' });
    }

    res.json(adoptionPost);
  } catch (error) {
    console.error('Error fetching adoption post:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update an adoption post
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, age, petType, description, status } = req.body;

    const adoptionPost = await Adoption.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      { name, age, petType, description, status },
      { new: true }
    );

    if (!adoptionPost) {
      return res.status(404).json({ message: 'Adoption post not found' });
    }

    res.json(adoptionPost);
  } catch (error) {
    console.error('Error updating adoption post:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete an adoption post
router.delete('/:id', auth, async (req, res) => {
  try {
    const adoptionPost = await Adoption.findOne({
      _id: req.params.id,
      userId: req.user.userId,
    });

    if (!adoptionPost) {
      return res.status(404).json({ message: 'Adoption post not found' });
    }

    // Delete image from Cloudinary
    const publicId = adoptionPost.imageUrl.split('/').pop().split('.')[0];
    await cloudinary.uploader.destroy(publicId);

    // Delete all related requests
    await AdoptionRequest.deleteMany({ adId: req.params.id });

    await adoptionPost.deleteOne();
    res.json({ message: 'Adoption post deleted successfully' });
  } catch (error) {
    console.error('Error deleting adoption post:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create adoption request
router.post('/:id/request', auth, async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;
    const adId = req.params.id;
    const requesterId = req.user.userId;

    const adoptionPost = await Adoption.findById(adId);
    if (!adoptionPost) {
      return res.status(404).json({ message: 'Adoption post not found' });
    }

    if (String(adoptionPost.userId) === String(requesterId)) {
      return res.status(400).json({ message: 'You cannot request your own post' });
    }

    if (adoptionPost.status !== 'available') {
      return res.status(400).json({ message: 'This pet is not available for adoption' });
    }

    const existingRequest = await AdoptionRequest.findOne({ 
      adId, 
      requester: requesterId,
      status: { $in: ['pending', 'accepted'] }
    });

    if (existingRequest) {
      return res.status(400).json({ message: 'You already have an active request for this pet' });
    }

    const adoptionRequest = new AdoptionRequest({
      adId,
      requester: requesterId,
      name,
      email,
      phone,
      message,
      status: 'pending'
    });

    await adoptionRequest.save();

    // Create adoption history entry
    const adoptionHistory = new AdoptionHistory({
      userId: requesterId,
      petId: adId,
      requestId: adoptionRequest._id,
      status: 'pending',
      petName: adoptionPost.name,
      petType: adoptionPost.petType,
      petImage: adoptionPost.imageUrl,
      message: message
    });

    await adoptionHistory.save();

    res.status(201).json(adoptionRequest);
  } catch (error) {
    console.error('Error creating adoption request:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get requests for a specific adoption post
router.get('/:id/requests', auth, async (req, res) => {
  try {
    const adoptionPost = await Adoption.findById(req.params.id);
    if (!adoptionPost) {
      return res.status(404).json({ message: 'Adoption post not found' });
    }

    // Only the post owner can see requests
    if (String(adoptionPost.userId) !== String(req.user.userId)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const requests = await AdoptionRequest.find({ adId: req.params.id })
      .populate('requester', 'username email')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error('Error fetching adoption requests:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update request status
router.put('/requests/:requestId', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const requestId = req.params.requestId;

    const adoptionRequest = await AdoptionRequest.findById(requestId)
      .populate('adId', 'userId');

    if (!adoptionRequest) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Only the post owner can update request status
    if (String(adoptionRequest.adId.userId) !== String(req.user.userId)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Update request status
    adoptionRequest.status = status;
    await adoptionRequest.save();

    // Update adoption history
    await AdoptionHistory.findOneAndUpdate(
      { requestId: requestId },
      { 
        status: status,
        responseDate: new Date()
      }
    );

    // If request is accepted, mark other requests as rejected
    if (status === 'accepted') {
      await AdoptionRequest.updateMany(
        { 
          adId: adoptionRequest.adId._id, 
          _id: { $ne: requestId },
          status: 'pending'
        },
        { status: 'rejected' }
      );

      // Update adoption post status to adopted
      await Adoption.findByIdAndUpdate(adoptionRequest.adId._id, { status: 'adopted' });

      // Update other pending history entries to rejected
      await AdoptionHistory.updateMany(
        {
          petId: adoptionRequest.adId._id,
          requestId: { $ne: requestId },
          status: 'pending'
        },
        {
          status: 'rejected',
          responseDate: new Date()
        }
      );
    }

    res.json(adoptionRequest);
  } catch (error) {
    console.error('Error updating request status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's adoption history
router.get('/history', auth, async (req, res) => {
  try {
    console.log('Adoption history request received');
    console.log('User from request:', req.user);
    
    // Try both userId and id formats
    const userId = req.user.userId || req.user.id;
    
    if (!userId) {
      console.error('No user ID found in request');
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    console.log('Looking for user with ID:', userId);
    
    // Check if the user exists
    const user = await User.findById(userId);
    if (!user) {
      console.error('User not found with ID:', userId);
      return res.status(404).json({ message: 'User not found' });
    }
    
    console.log('User found, fetching adoption history');
    
    // Try to find adoption history entries
    const history = await AdoptionHistory.find({ userId: userId })
      .sort({ createdAt: -1 });
    
    console.log(`Found ${history.length} adoption history entries`);
    
    res.json(history);
  } catch (error) {
    console.error('Error fetching adoption history:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? {
        name: error.name,
        code: error.code,
        stack: error.stack
      } : undefined
    });
  }
});

module.exports = router;