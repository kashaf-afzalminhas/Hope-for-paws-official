// adoptionController.js
const AdoptionPost = require('../models/adoptionModel');
const User = require('../models/User'); // Import the User model
const { sendEmail } = require('../routes/mailer.js');

// Get all posts
exports.getAllPosts = async (req, res) => {
  try {
    const posts = await AdoptionPost.find().populate('userId', 'username email');
    res.status(200).json(posts);
  } catch (error) {
    console.error('Error fetching all posts:', error);
    res.status(500).json({ message: 'Failed to fetch posts', error: error.message });
  }
};

exports.addPost = async (req, res) => {
  try {
    const { name, age, petType, location, description } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
    
    // Get user ID from the authenticated request
    const userId = req.user?.userId || req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!name || !age || !petType || !location || !description) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (!imageUrl) {
      return res.status(400).json({ message: 'Image is required' });
    }

    const newPost = new AdoptionPost({
      userId,
      name,
      age,
      petType,
      location,
      description,
      imageUrl,
      status: 'available'
    });

    await newPost.save();

    // Populate user info for response
    await newPost.populate('userId', 'username email');

    console.log('New adoption post created:', newPost);

    // Fetch all users from the database (optional - for email notifications)
    try {
      const users = await User.find({}, 'email');
      console.log('Fetched users for notifications:', users.length);

      // Send email notification to all users
      const subject = 'New Adoption Post Added';
      const text = `A new adoption post has been added:\n\nName: ${name}\nAge: ${age}\nPet Type: ${petType}\nLocation: ${location}\nDescription: ${description}`;

      // Use Promise.all to send emails in parallel
      await Promise.all(
        users.map((user) => {
          console.log(`Sending email to ${user.email}`);
          return sendEmail(user.email, subject, text).then((result) => {
            console.log(`Email sent to ${user.email}:`, result);
          }).catch((error) => {
            console.error(`Error sending email to ${user.email}:`, error);
          });
        })
      );
      console.log('All emails sent successfully');
    } catch (emailError) {
      console.error('Error in sending emails:', emailError);
      // Don't fail the request if email sending fails
    }

    res.status(201).json(newPost);
  } catch (error) {
    console.error('Error in addPost:', error);
    res.status(500).json({ message: 'Failed to create post', error: error.message });
  }
};

// Update a post
exports.updatePost = async (req, res) => {
  const { id } = req.params;
  const { name, age, petType, location, description } = req.body;
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : undefined;

  try {
    const updateData = { name, age, petType, location, description };
    if (imageUrl) {
      updateData.imageUrl = imageUrl;
    }

    const updatedPost = await AdoptionPost.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate('userId', 'username email');

    if (!updatedPost) return res.status(404).json({ message: 'Post not found' });

    res.status(200).json(updatedPost);
  } catch (error) {
    console.error('Error in updatePost:', error);
    res.status(500).json({ message: 'Failed to update post', error: error.message });
  }
};

// Delete a post
exports.deletePost = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedPost = await AdoptionPost.findByIdAndDelete(id);
    if (!deletedPost) return res.status(404).json({ message: 'Post not found' });

    res.status(200).json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error in deletePost:', error);
    res.status(500).json({ message: 'Failed to delete post', error: error.message });
  }
};

// Get posts by user
exports.getPostsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const posts = await AdoptionPost.find({ userId }).populate('userId', 'username email');
    res.status(200).json(posts);
  } catch (error) {
    console.error('Error fetching user posts:', error);
    res.status(500).json({ message: 'Failed to fetch user posts', error: error.message });
  }
};