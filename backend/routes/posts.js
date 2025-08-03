const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const auth = require('../middleware/auth');
const dotenv = require('dotenv')
dotenv.config();

const router = express.Router();
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

console.log('Cloudinary API Secret is set:', !!process.env.CLOUDINARY_API_SECRET);

console.log('CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME);
console.log('CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY);
console.log('CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET);


// Configure Multer

const storage = multer.memoryStorage();
const upload = multer({ storage });

// Get all posts
router.get('/', async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('userId', 'username isVeterinarian')
      .sort({ createdAt: -1 });

    // Fetch and populate comments for each post
    const postsWithComments = await Promise.all(
      posts.map(async (post) => {
        const comments = await Comment.find({ postId: post._id })
          .populate('userId', 'username isVeterinarian')
          .sort({ createdAt: 1 });
        
        const postObject = post.toObject();
        return {
          ...postObject,
          comments: comments
        };
      })
    );

    res.json(postsWithComments);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single post
router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('userId', 'username isVeterinarian');

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comments = await Comment.find({ postId: post._id })
      .populate('userId', 'username isVeterinarian')
      .sort({ createdAt: 1 });

    const postObject = post.toObject();
    const postWithComments = {
      ...postObject,
      comments: comments
    };

    res.json(postWithComments);
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's posts

router.get('/user/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const posts = await Post.find({ userId })
      .populate('userId', 'username isVeterinarian')
      .sort({ createdAt: -1 });

    const postsWithComments = await Promise.all(
      posts.map(async (post) => {
        const comments = await Comment.find({ postId: post._id })
          .populate('userId', 'username isVeterinarian')
          .sort({ createdAt: 1 });
        
        const postObject = post.toObject();
        return {
          ...postObject,
          comments: comments
        };
      })
    );

    res.json(postsWithComments);
  } catch (error) {
    console.error('Error fetching user posts:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create post
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    const { caption } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'Image is required' });
    }

    // Upload image to Cloudinary
    const b64 = Buffer.from(req.file.buffer).toString('base64');
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;
    const uploadResponse = await cloudinary.uploader.upload(dataURI);

    const post = new Post({
      userId: req.user.userId, // Ensure userId is set correctly
      caption,
      imageUrl: uploadResponse.secure_url,
    });

    await post.save();

    // Notify veterinarians about new post
    if (global.notificationService) {
      global.notificationService.notifyVetsNewPost(post._id, caption, req.user.userId);
    }

    // Populate user data before sending response
    const populatedPost = await Post.findById(post._id)
      .populate('userId', 'username isVeterinarian');

    res.status(201).json(populatedPost);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// router.post('/create', async (req, res) => {
//   try {
//     const { title, content } = req.body;

//     if (!title || !content) {
//       return res.status(400).json({ message: "Title and content are required." });
//     }

//     const newPost = new Post({ title, content });
//     await newPost.save();

//     res.status(201).json({ message: "Post created successfully!" });
//   } catch (error) {
//     console.error("Error creating post:", error);
//     res.status(500).json({ message: "Failed to create post. Please try again." });
//   }
// });




// Update post
router.put('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user.userId,
      },
      { $set: { caption: req.body.caption } },
      { new: true }
    ).populate('userId', 'username isVeterinarian');

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comments = await Comment.find({ postId: post._id })
      .populate('userId', 'username isVeterinarian')
      .sort({ createdAt: 1 });

    const postObject = post.toObject();
    const postWithComments = {
      ...postObject,
      comments: comments
    };

    res.json(postWithComments);
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete post
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findOne({
      _id: req.params.id,
      userId: req.user.userId,
    });

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Delete image from Cloudinary
    const publicId = post.imageUrl.split('/').pop().split('.')[0];
    await cloudinary.uploader.destroy(publicId);

    // Delete all comments associated with the post
    await Comment.deleteMany({ postId: post._id });

    // Delete the post
    await post.deleteOne();

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Like/Unlike post
router.post('/:id/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const likeIndex = post.likes.indexOf(req.user.userId);
    const wasLiked = likeIndex !== -1;
    
    if (likeIndex === -1) {
      post.likes.push(req.user.userId);
    } else {
      post.likes.splice(likeIndex, 1);
    }

    await post.save();

    // Send notification for new like (not for unlike)
    if (!wasLiked && global.notificationService) {
      global.notificationService.notifyPostLike(req.params.id, req.user.userId);
    }

    // Populate user data before sending response
    const populatedPost = await Post.findById(post._id)
      .populate('userId', 'username isVeterinarian');

    const comments = await Comment.find({ postId: post._id })
      .populate('userId', 'username isVeterinarian')
      .sort({ createdAt: 1 });

    const postObject = populatedPost.toObject();
    const postWithComments = {
      ...postObject,
      comments: comments
    };

    res.json(postWithComments);
  } catch (error) {
    console.error('Error updating post likes:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
