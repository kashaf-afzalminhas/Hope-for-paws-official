// adoptionController.js
const AdoptionPost = require('../models/adoptionModel');
const User = require('../models/User'); // Import the User model
const { sendEmail } = require('../routes/mailer.js');

// Get all posts
exports.getAllPosts = async (req, res) => {
  try {
    const posts = await AdoptionPost.find();
    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch posts', error });
  }
};

exports.addPost = async (req, res) => {
  const { name, age, location, description } = req.body;
  const image = req.file ? req.file.path : null;

  try {
    const newPost = new AdoptionPost({ name, age, location, description, image });
    await newPost.save();

    // Fetch all users from the database
    const users = await User.find({}, 'email');
    console.log('Fetched users:', users); // Log fetched users

    // Send email to all users
    const subject = 'New Adoption Post Added';
    const text = `A new adoption post has been added:\n\nName: ${name}\nAge: ${age}\nLocation: ${location}\nDescription: ${description}`;

    // Use Promise.all to send emails in parallel
    try {
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
    } catch (error) {
      console.error('Error in sending emails:', error);
    }

    res.status(201).json(newPost);
  } catch (error) {
    console.error('Error in addPost:', error); // Log any errors
    res.status(400).json({ message: 'Failed to create post', error });
  }
};

// Update a post
exports.updatePost = async (req, res) => {
  const { id } = req.params;
  const { name, age, location, description } = req.body;
  const image = req.file ? req.file.path : null; // Use full path for image upload

  try {
    const updatedPost = await AdoptionPost.findByIdAndUpdate(
      id,
      { name, age, location, description, image },
      { new: true }
    );

    if (!updatedPost) return res.status(404).json({ message: 'Post not found' });

    res.status(200).json(updatedPost);
  } catch (error) {
    res.status(400).json({ message: 'Failed to update post', error });
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
    res.status(500).json({ message: 'Failed to delete post', error });
  }
};