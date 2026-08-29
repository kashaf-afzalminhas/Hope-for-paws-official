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
const sanitizeHtml = require('sanitize-html');

// Multer file filter to reject non-image MIME types (Bug 9)
const imageFileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.');
    error.status = 400;
    cb(error, false);
  }
};

// Configure Multer with strict 5MB per-file limit to prevent DoS
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit per file
  }
});

// Constants for adoption post images
const MAX_ADOPTION_IMAGES = 100;
const MAX_TOTAL_IMAGE_SIZE = 100 * 1024 * 1024; // 100MB total for all images in one request

/**
 * When a listing goes from adopted → available (adoption fell through),
 * restore accepted and auto-rejected requests to pending so adopters see "Request sent"
 * and the owner can review again.
 */
async function reopenListingRequestsForAvailability(adId, adoptionName) {
  const requestsToReopen = await AdoptionRequest.find({
    adId,
    status: { $in: ['accepted', 'rejected'] },
  });

  if (!requestsToReopen.length) {
    return { reopenedCount: 0, requesterIds: [] };
  }

  const requestIds = requestsToReopen.map((r) => r._id);
  const requesterIds = requestsToReopen.map((r) => String(r.requester));

  await AdoptionRequest.updateMany(
    { adId, status: { $in: ['accepted', 'rejected'] } },
    { $set: { status: 'pending' } }
  );

  await AdoptionHistory.updateMany(
    { requestId: { $in: requestIds } },
    { $set: { status: 'pending' }, $unset: { responseDate: 1 } }
  );

  if (global.notificationService) {
    for (const reqDoc of requestsToReopen) {
      try {
        await global.notificationService.createNotification({
          recipient: reqDoc.requester,
          sender: null,
          type: 'adoption_request_pending',
          title: 'Adoption listing available again',
          message: `${adoptionName || 'This pet'} is available again. Your request is pending the owner's review.`,
          data: { adoptionId: adId, adoptionRequestId: reqDoc._id },
        });
      } catch (notifyErr) {
        console.error('Error notifying requester of reopened listing:', notifyErr);
      }
    }
  }

  return { reopenedCount: requestsToReopen.length, requesterIds };
}

// Create an adoption post
router.post('/', auth, upload.array('images', MAX_ADOPTION_IMAGES), async (req, res) => {
  console.log('=== ADOPTION POST ROUTE HIT ===');
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);
  console.log('Request headers:', req.headers);
  
  try {
    const { name, age, petType, breed, vaccinated, neuteredSpayed, description, location } = req.body;
    
    // Debug logging
    console.log('Received adoption post data:');
    console.log('name:', name);
    console.log('age:', age);
    console.log('petType:', petType);
    console.log('breed:', breed);
    console.log('vaccinated:', vaccinated);
    console.log('neuteredSpayed:', neuteredSpayed);
    console.log('description:', description);
    console.log('location:', location);
    console.log('Number of images received:', req.files ? req.files.length : 0);
    console.log('Full req.body:', req.body);

    // Check if at least one image is provided
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'At least one image is required' });
    }

    // Validate total size of all images
    let totalSize = 0;
    for (const file of req.files || []) {
      totalSize += file.size;
    }
    if (totalSize > MAX_TOTAL_IMAGE_SIZE) {
      return res.status(400).json({ message: `Total image size cannot exceed 100MB (received ${(totalSize / 1024 / 1024).toFixed(1)}MB)` });
    }

    // Sanitize input to prevent Stored XSS
    const sanitizedName = name ? sanitizeHtml(name, { allowedTags: [], allowedAttributes: {} }) : '';
    const sanitizedPetType = petType ? sanitizeHtml(petType, { allowedTags: [], allowedAttributes: {} }) : '';
    const sanitizedBreed = breed ? sanitizeHtml(breed, { allowedTags: [], allowedAttributes: {} }) : '';
    const sanitizedDescription = description ? sanitizeHtml(description, { allowedTags: [], allowedAttributes: {} }) : '';
    const sanitizedLocation = location ? sanitizeHtml(location, { allowedTags: [], allowedAttributes: {} }) : 'Location not specified';
    
    // Strictly validate age as a positive Number
    const parsedAge = Number(age);
    if (isNaN(parsedAge) || parsedAge <= 0) {
      return res.status(400).json({ message: 'Age must be greater than 0' });
    }

    // Upload all images to Cloudinary
    const uploadedUrls = [];
    let uploadError = null;

    for (let i = 0; i < (req.files || []).length; i++) {
      const file = req.files[i];
      try {
        const b64 = Buffer.from(file.buffer).toString('base64');
        const dataURI = `data:${file.mimetype};base64,${b64}`;
        const uploadResponse = await cloudinary.uploader.upload(dataURI, {
          allowed_formats: ['jpg', 'jpeg', 'png', 'webp']
        });
        uploadedUrls.push(uploadResponse.secure_url);
      } catch (uploadErr) {
        console.error(`Error uploading image ${i + 1}:`, uploadErr);
        uploadError = uploadErr;
        // On first error, attempt to clean up successfully uploaded images
        if (uploadedUrls.length > 0) {
          console.log('Cleaning up successfully uploaded images due to partial failure...');
          for (const url of uploadedUrls) {
            try {
              const urlParts = url.split('/upload/');
              if (urlParts.length > 1) {
                const pathAfterUpload = urlParts[1].replace(/^v\d+\//, '');
                const publicId = pathAfterUpload.split('.')[0];
                await cloudinary.uploader.destroy(publicId);
              }
            } catch (cleanupErr) {
              console.error('Non-fatal cleanup error:', cleanupErr);
            }
          }
        }
        break;
      }
    }

    if (uploadError) {
      return res.status(500).json({ message: 'Failed to upload one or more images. No images were saved. Please try again.' });
    }

    if (uploadedUrls.length === 0) {
      return res.status(400).json({ message: 'No valid images could be uploaded' });
    }

    const adoptionPost = new Adoption({
      userId: req.user.userId,
      name: sanitizedName,
      age: parsedAge,
      petType: sanitizedPetType,
      breed: sanitizedBreed,
      vaccinated,
      neuteredSpayed,
      description: sanitizedDescription,
      location: sanitizedLocation,
      imageUrls: uploadedUrls,
      status: 'available' // Default status
    });

    console.log('Saving adoption post with location:', adoptionPost.location);
    console.log('Number of images to save:', uploadedUrls.length);
    await adoptionPost.save();
    console.log('Adoption post saved successfully');
    
    // Fetch the saved post to ensure all fields are included
    const savedPost = await Adoption.findById(adoptionPost._id).populate('userId', 'username');
    console.log('Saved post with all fields:', savedPost);
    console.log('Response being sent:', JSON.stringify(savedPost, null, 2));
    
    res.status(201).json(savedPost);
  } catch (error) {
    console.error('Error creating adoption post:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all adoption posts (public)
router.get('/', async (req, res) => {
  try {
    console.log('Fetching adoption posts...');
    // Remove the status filter to show all posts
    const adoptionPosts = await Adoption.find()
      .populate('userId', 'username')
      .sort({ createdAt: -1 });
    console.log('Adoption posts fetched successfully:', adoptionPosts.length);
    res.json(adoptionPosts);
  } catch (error) {
    console.error('Error fetching adoption posts:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Record a public share. No login is required because shared links are public.
router.post('/:id/share', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid adoption ID format' });
    }
    const adoption = await Adoption.findByIdAndUpdate(
      req.params.id,
      { $inc: { shareCount: 1 } },
      { new: true, select: 'shareCount' }
    );
    if (!adoption) return res.status(404).json({ message: 'Adoption listing not found' });
    res.json({ shareCount: adoption.shareCount });
  } catch (error) {
    console.error('Error recording adoption share:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get adoption posts for a specific user (auth required to prevent IDOR)
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const userId = req.params.userId;
    const includeRequests = req.query.includeRequests === 'true';

    let query = Adoption.find({ userId })
      .populate('userId', 'username')
      .sort({ createdAt: -1 });

    if (includeRequests) {
      query = query.populate({
        path: 'requests',
        model: 'AdoptionRequest',
        select: 'name email phone message status petHistoryImage createdAt requester',
        populate: { path: 'requester', select: 'username _id' },
      });
    }

    const adoptionPosts = await query.exec();
    res.json(adoptionPosts);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's adoption history
router.get('/history', auth, async (req, res) => {
  try {
    console.log('Adoption history request received');
    console.log('User from request:', req.user);
    
    // Get user ID and ensure it's valid
    const userId = req.user.userId || req.user.id;
    
    if (!userId) {
      console.error('No user ID found in request');
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Convert string ID to ObjectId
    let userObjectId;
    try {
      userObjectId = new mongoose.Types.ObjectId(userId);
    } catch (error) {
      console.error('Invalid user ID format:', userId);
      return res.status(400).json({ message: 'Invalid user ID format' });
    }
    
    console.log('Looking for user with ID:', userObjectId);
    
    // Check if the user exists
    const user = await User.findById(userObjectId);
    if (!user) {
      console.error('User not found with ID:', userObjectId);
      return res.status(404).json({ message: 'User not found' });
    }
    
    console.log('User found, fetching adoption history');
    
    // Try to find adoption history entries with populated references
    const history = await AdoptionHistory.find({ userId: userObjectId })
      .populate({
        path: 'petId',
        select: 'name petType imageUrl imageUrls location userId',
        populate: { path: 'userId', select: 'username profileImage' },
      })
      .populate('requestId', 'status message')
      .sort({ createdAt: -1 })
      .lean();

    console.log(`Found ${history.length} adoption history entries`);

    const transformedHistory = history.map((entry) => {
      const owner = entry.petId?.userId;
      const posterUserId =
        owner && typeof owner === 'object' && owner._id != null
          ? String(owner._id)
          : entry.petId?.userId != null
            ? String(entry.petId.userId)
            : null;
      const posterUsername =
        owner && typeof owner === 'object' && owner.username ? owner.username : null;
      const posterProfileImage =
        owner && typeof owner === 'object' && owner.profileImage ? owner.profileImage : '';

      return {
        _id: entry._id,
        id: entry._id,
        petName: entry.petName,
        petType: entry.petType,
        petImage: entry.petImage,
        petLocation: entry.petId?.location || '',
        status: entry.status,
        requestDate: entry.requestDate,
        responseDate: entry.responseDate,
        message: entry.message,
        pet: entry.petId,
        request: entry.requestId,
        posterUserId,
        posterUsername,
        posterProfileImage,
      };
    });
    
    res.json(transformedHistory);
  } catch (error) {
    console.error('Error fetching adoption history:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code
    });
    
    // Send appropriate error response
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        message: 'Invalid ID format',
        error: error.message 
      });
    }
    
    res.status(500).json({ 
      message: 'Error fetching adoption history',
      error: error.message
    });
  }
});

// ==========================================
// NEW: Adoption Stat Endpoints
// ==========================================

// 1. Get logged-in user's adoption counts
router.get('/user-stats', auth, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const [totalPosts, adoptedCount, pendingCount] = await Promise.all([
      Adoption.countDocuments({ userId }),
      Adoption.countDocuments({ userId, status: 'adopted' }),
      Adoption.countDocuments({ userId, status: 'available' }),
    ]);

    res.json({
      success: true,
      data: { totalPosts, adoptedCount, pendingCount },
    });
  } catch (error) {
    console.error('Error fetching user adoption stats:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// 2. Get global total adoption count for Homepage (Public, no auth)
router.get('/public-count', async (req, res) => {
  try {
    // Counts every single adoption post created by all users
    const totalAdoptions = await Adoption.countDocuments();
    res.json({
      success: true,
      totalAdoptions,
    });
  } catch (error) {
    console.error('Error fetching public adoption count:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
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
    const { name, age, petType, breed, vaccinated, neuteredSpayed, description, status, location } = req.body;

    if (status && !['available', 'pending', 'adopted'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const existingPost = await Adoption.findOne({
      _id: req.params.id,
      userId: req.user.userId,
    });

    if (!existingPost) {
      return res.status(404).json({ message: 'Adoption post not found' });
    }

    const previousStatus = existingPost.status;

    const updatePayload = {};
    if (name !== undefined) updatePayload.name = name;
    if (age !== undefined) updatePayload.age = age;
    if (petType !== undefined) updatePayload.petType = petType;
    if (breed !== undefined) updatePayload.breed = breed;
    if (vaccinated !== undefined) updatePayload.vaccinated = vaccinated;
    if (neuteredSpayed !== undefined) updatePayload.neuteredSpayed = neuteredSpayed;
    if (description !== undefined) updatePayload.description = description;
    if (status !== undefined) updatePayload.status = status;
    if (location !== undefined) updatePayload.location = location;

    // Sanitize input to prevent Stored XSS
    const sanitizedName = name ? sanitizeHtml(name, { allowedTags: [], allowedAttributes: {} }) : undefined;
    const sanitizedPetType = petType ? sanitizeHtml(petType, { allowedTags: [], allowedAttributes: {} }) : undefined;
    const sanitizedBreed = breed ? sanitizeHtml(breed, { allowedTags: [], allowedAttributes: {} }) : undefined;
    const sanitizedDescription = description ? sanitizeHtml(description, { allowedTags: [], allowedAttributes: {} }) : undefined;
    const sanitizedLocation = location ? sanitizeHtml(location, { allowedTags: [], allowedAttributes: {} }) : undefined;

    // Strictly validate age if provided
    let parsedAge;
    if (age !== undefined) {
      parsedAge = Number(age);
      if (isNaN(parsedAge) || parsedAge <= 0) {
        return res.status(400).json({ message: 'Age must be greater than 0' });
      }
    }

    const adoptionPost = await Adoption.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      { 
        name: sanitizedName, 
        age: parsedAge, 
        petType: sanitizedPetType, 
        breed: sanitizedBreed, 
        vaccinated, 
        neuteredSpayed, 
        description: sanitizedDescription, 
        status, 
        location: sanitizedLocation 
      },
      updatePayload,
      { new: true }
    );

    let reopenedRequests = 0;

    if (status === 'available' && previousStatus === 'adopted') {
      const { reopenedCount } = await reopenListingRequestsForAvailability(
        req.params.id,
        adoptionPost.name
      );
      reopenedRequests = reopenedCount;
    }

    const response = adoptionPost.toObject ? adoptionPost.toObject() : adoptionPost;
    response.reopenedRequests = reopenedRequests;

    res.json(response);
  } catch (error) {
    console.error('Error updating adoption post:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update adoption post images (supports multiple images)
router.put('/:id/image', auth, upload.array('images', MAX_ADOPTION_IMAGES), async (req, res) => {
  try {
    // Ensure the post belongs to the user
    const adoptionPost = await Adoption.findOne({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!adoptionPost) {
      return res.status(404).json({ message: 'Adoption post not found' });
    }

    // Get list of images to remove (if provided in body)
    let indicesToRemove = [];
    try {
      indicesToRemove = req.body.indicesToRemove ? JSON.parse(req.body.indicesToRemove) : [];
    } catch {
      return res.status(400).json({ message: 'Invalid image removal data' });
    }
    if (!Array.isArray(indicesToRemove)) {
      return res.status(400).json({ message: 'Invalid image removal data' });
    }
    
    // Calculate total size of new images
    let totalSize = 0;
    for (const file of req.files || []) {
      totalSize += file.size;
    }
    if (totalSize > MAX_TOTAL_IMAGE_SIZE) {
      return res.status(400).json({ message: `Total image size cannot exceed 100MB (received ${(totalSize / 1024 / 1024).toFixed(1)}MB)` });
    }

    // Upload new images to Cloudinary
    const newUploadedUrls = [];
    let uploadError = null;

    for (let i = 0; i < (req.files || []).length; i++) {
      const file = req.files[i];
      try {
        const b64 = Buffer.from(file.buffer).toString('base64');
        const dataURI = `data:${file.mimetype};base64,${b64}`;
        const uploadResponse = await cloudinary.uploader.upload(dataURI, {
          allowed_formats: ['jpg', 'jpeg', 'png', 'webp']
        });
        newUploadedUrls.push(uploadResponse.secure_url);
      } catch (uploadErr) {
        console.error(`Error uploading image ${i + 1}:`, uploadErr);
        uploadError = uploadErr;
        // Clean up successfully uploaded images on error
        if (newUploadedUrls.length > 0) {
          console.log('Cleaning up successfully uploaded images due to upload failure...');
          for (const url of newUploadedUrls) {
            try {
              const urlParts = url.split('/upload/');
              if (urlParts.length > 1) {
                const pathAfterUpload = urlParts[1].replace(/^v\d+\//, '');
                const publicId = pathAfterUpload.split('.')[0];
                await cloudinary.uploader.destroy(publicId);
              }
            } catch (cleanupErr) {
              console.error('Non-fatal cleanup error:', cleanupErr);
            }
          }
        }
        break;
      }
    }

    if (uploadError) {
      return res.status(500).json({ message: 'Failed to upload one or more new images. Please try again.' });
    }

    // Get current images (supporting both old and new formats for backward compatibility)
    const currentImages = adoptionPost.imageUrls || (adoptionPost.imageUrl ? [adoptionPost.imageUrl] : []);

    if ((!req.files || req.files.length === 0) && indicesToRemove.length === 0) {
      return res.status(400).json({ message: 'Select a new photo or remove an existing photo' });
    }

    // Remove specified images from current list
    let updatedImages = [...currentImages];
    if (indicesToRemove && indicesToRemove.length > 0) {
      updatedImages = updatedImages.filter((_, index) => !indicesToRemove.includes(index));
    }

    // Add new images
    updatedImages = [...updatedImages, ...newUploadedUrls];

    // Ensure we still have at least one image
    if (updatedImages.length === 0) {
      // Clean up newly uploaded images if we would end up with no images
      for (const url of newUploadedUrls) {
        try {
          const urlParts = url.split('/upload/');
          if (urlParts.length > 1) {
            const pathAfterUpload = urlParts[1].replace(/^v\d+\//, '');
            const publicId = pathAfterUpload.split('.')[0];
            await cloudinary.uploader.destroy(publicId);
          }
        } catch (cleanupErr) {
          console.error('Non-fatal cleanup error:', cleanupErr);
        }
      }
      return res.status(400).json({ message: 'At least one image must be kept' });
    }

    // Delete old images that were removed from Cloudinary
    const imagesToDelete = currentImages.filter((_, index) => indicesToRemove.includes(index));
    for (const url of imagesToDelete) {
      try {
        const urlParts = url.split('/upload/');
        if (urlParts.length > 1) {
          const pathAfterUpload = urlParts[1].replace(/^v\d+\//, '');
          const publicId = pathAfterUpload.split('.')[0];
          await cloudinary.uploader.destroy(publicId);
        }
      } catch (e) {
        console.error('Non-fatal old image deletion error:', e);
        console.warn('Failed to delete old image from Cloudinary:', e.message);
      }
    }

    // Update the adoption post with new images
    adoptionPost.imageUrls = updatedImages;
    adoptionPost.imageUrl = updatedImages[0]; // Keep first image as fallback for backward compatibility
    await adoptionPost.save();

    res.json({ 
      imageUrls: adoptionPost.imageUrls,
      message: 'Images updated successfully'
    });
  } catch (error) {
    console.error('Error updating adoption images:', error);
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

    // Delete all associated images from Cloudinary
    const imagesToDelete = adoptionPost.imageUrls || (adoptionPost.imageUrl ? [adoptionPost.imageUrl] : []);
    
    for (const imageUrl of imagesToDelete) {
      try {
        const urlParts = imageUrl.split('/upload/');
        if (urlParts.length > 1) {
          const pathAfterUpload = urlParts[1].replace(/^v\d+\//, '');
          const publicId = pathAfterUpload.split('.')[0];
          await cloudinary.uploader.destroy(publicId);
        } else {
          const publicId = imageUrl.split('/').pop().split('.')[0];
          await cloudinary.uploader.destroy(publicId);
        }
      } catch (e) {
        console.error('Non-fatal image deletion error for image:', imageUrl, e);
      }
    }

    // Delete all related requests
    await AdoptionRequest.deleteMany({ adId: req.params.id });

    // Delete all related adoption history entries to prevent orphaned records
    await AdoptionHistory.deleteMany({ petId: req.params.id });

    await adoptionPost.deleteOne();
    res.json({ message: 'Adoption post deleted successfully' });
  } catch (error) {
    console.error('Error deleting adoption post:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create adoption request
router.post('/:id/request', auth, upload.single('petHistoryImage'), async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;
    const adId = req.params.id;
    const requesterId = req.user.userId;

    // Validate required fields
    if (!name || !email || !phone || !message) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Sanitize user inputs to prevent Stored XSS
    const sanitizedName = sanitizeHtml(name, { allowedTags: [], allowedAttributes: {} });
    const sanitizedEmail = sanitizeHtml(email, { allowedTags: [], allowedAttributes: {} });
    const sanitizedPhone = sanitizeHtml(phone, { allowedTags: [], allowedAttributes: {} });
    const sanitizedMessage = sanitizeHtml(message, { allowedTags: [], allowedAttributes: {} });

    // Upload image to Cloudinary if present (restrict allowed formats)
    let petHistoryImageUrl = '';
    if (req.file) {
      const b64 = Buffer.from(req.file.buffer).toString('base64');
      const dataURI = `data:${req.file.mimetype};base64,${b64}`;
      const uploadResponse = await cloudinary.uploader.upload(dataURI, {
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp']
      });
      petHistoryImageUrl = uploadResponse.secure_url;
    }

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
      status: { $in: ['pending', 'accepted', 'rejected'] }
    });

    if (existingRequest) {
      return res.status(400).json({ message: 'You already have a request (pending, accepted, or rejected) for this pet' });
    }

    const adoptionRequest = new AdoptionRequest({
      adId,
      requester: requesterId,
      name: sanitizedName,
      email: sanitizedEmail,
      phone: sanitizedPhone,
      message: sanitizedMessage,
      petHistoryImage: petHistoryImageUrl,
      status: 'pending'
    });

    await adoptionRequest.save();

    // Add the request to the adoption post's requests array
    await Adoption.findByIdAndUpdate(adId, { $push: { requests: adoptionRequest._id } });

    // Create adoption history entry
    // Get the first image (supports both new imageUrls array and old imageUrl field)
    const petImageUrl = adoptionPost.imageUrls?.[0] || adoptionPost.imageUrl;
    
    const adoptionHistory = new AdoptionHistory({
      userId: requesterId,
      petId: adId,
      requestId: adoptionRequest._id,
      status: 'pending',
      petName: adoptionPost.name,
      petType: adoptionPost.petType,
      petImage: petImageUrl,
      image: petHistoryImageUrl, // Store the pet history image (may be empty)
      message: message
    });

    await adoptionHistory.save();

    // Send notification for adoption request
    if (global.notificationService) {
      global.notificationService.notifyAdoptionRequest(adId, requesterId, adoptionRequest._id);
    }

    res.status(201).json(adoptionRequest);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'You have already submitted a request for this pet.' });
    }
    console.error('Error creating adoption request:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get adoption requests for a post
router.get('/:id/requests', auth, async (req, res) => {
  try {
    const adoptionPost = await Adoption.findById(req.params.id);
    if (!adoptionPost) {
      return res.status(404).json({ message: 'Adoption post not found' });
    }

    // Check if user is authorized to view requests
    if (String(adoptionPost.userId) !== String(req.user.userId)) {
      return res.status(403).json({ message: 'Unauthorized to view these requests' });
    }

    const requests = await AdoptionRequest.find({ adId: req.params.id })
      .populate('requester', 'username email')
      .select('name email phone message status petHistoryImage requester createdAt')
      .sort({ createdAt: -1 });

    console.log('Fetched requests:', JSON.stringify(requests, null, 2));
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

    // Explicitly validate status against enum values before processing database operations
    const allowedStatuses = ['pending', 'accepted', 'rejected'];
    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Allowed values are: ${allowedStatuses.join(', ')}` });
    }

    const adoptionRequest = await AdoptionRequest.findById(requestId)
      .populate('adId', 'userId name');

    if (!adoptionRequest) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Only the post owner can update request status
    if (String(adoptionRequest.adId.userId) !== String(req.user.userId)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Atomically update request status only if it is currently 'pending' to prevent double approvals
    const updatedRequest = await AdoptionRequest.findOneAndUpdate(
      { _id: requestId, status: 'pending' },
      { status: status },
      { new: true }
    );

    if (!updatedRequest) {
      return res.status(400).json({ message: 'Request has already been processed (approved or rejected)' });
    }

    // Update adoption history
    await AdoptionHistory.findOneAndUpdate(
      { requestId: requestId },
      { 
        status: status,
        responseDate: new Date()
      }
    );

    // Send notification for adoption request status change
    if (global.notificationService) {
      // Fetch adoption data directly to ensure we have the name
      const adoption = await Adoption.findById(adoptionRequest.adId._id);
      const adoptionName = adoption ? adoption.name : 'Unknown Pet';
      
      console.log('Adoption name for notification:', adoptionName);
      global.notificationService.notifyAdoptionRequestStatus(
        adoptionRequest.adId._id, 
        adoptionRequest.requester, 
        status, 
        adoptionName
      );
    }

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

// Check if user has already requested adoption for a post
router.get('/:id/check-request', auth, async (req, res) => {
  try {
    const adId = req.params.id;
    const requesterId = req.user.userId;

    const adoptionPost = await Adoption.findById(adId).select('status');

    const existingRequest = await AdoptionRequest.findOne({
      adId,
      requester: requesterId,
      status: { $in: ['pending', 'accepted'] },
    });

    res.json({
      hasRequest: !!existingRequest,
      requestStatus: existingRequest ? existingRequest.status : null,
      requestId: existingRequest ? existingRequest._id : null,
      postStatus: adoptionPost ? adoptionPost.status : null,
    });
  } catch (error) {
    console.error('Error checking adoption request:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;