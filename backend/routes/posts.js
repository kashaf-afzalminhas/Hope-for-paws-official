const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const sanitizeHtml = require('sanitize-html');
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

console.log('Cloudinary Config Present:', {
  cloud_name: !!process.env.CLOUDINARY_CLOUD_NAME,
  api_key: !!process.env.CLOUDINARY_API_KEY,
  api_secret: !!process.env.CLOUDINARY_API_SECRET,
});


// Configure Multer with security limits
const storage = multer.memoryStorage();
const imageFileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};
const upload = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Get all posts (public, paginated, batched comments)
router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    // Count total for pagination metadata
    const total = await Post.countDocuments();

    const posts = await Post.find()
      .populate('userId', 'username isVeterinarian')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Batch-fetch all comments for this page of posts (eliminates N+1)
    const postIds = posts.map(p => p._id);
    const allComments = await Comment.find({ postId: { $in: postIds } })
      .populate('userId', 'username isVeterinarian')
      .sort({ createdAt: 1 });

    // Group comments by postId in memory
    const commentsByPostId = {};
    allComments.forEach(comment => {
      const pid = comment.postId.toString();
      if (!commentsByPostId[pid]) commentsByPostId[pid] = [];
      commentsByPostId[pid].push(comment);
    });

    const postsWithComments = posts.map(post => {
      const postObject = post.toObject();
      return {
        ...postObject,
        comments: commentsByPostId[post._id.toString()] || []
      };
    });

    res.json(postsWithComments);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single post (public)
router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid post ID format' });
    }

    const post = await Post.findById(req.params.id)
      .populate('userId', 'username isVeterinarian');

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    let comments = [];
    try {
      comments = await Comment.find({ postId: post._id })
        .populate('userId', 'username isVeterinarian')
        .sort({ createdAt: 1 });
    } catch (commentError) {
      console.error('Error loading comments for post:', commentError);
    }

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

// Record a public share. No login is required because shared links are public.
router.post('/:id/share', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid post ID format' });
    }
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { $inc: { shareCount: 1 } },
      { new: true, select: 'shareCount' }
    );
    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.json({ shareCount: post.shareCount });
  } catch (error) {
    console.error('Error recording post share:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's posts (auth required, batched comments)
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const userId = req.params.userId;
    const posts = await Post.find({ userId })
      .populate('userId', 'username isVeterinarian')
      .sort({ createdAt: -1 });

    // Batch-fetch comments (eliminates N+1)
    const postIds = posts.map(p => p._id);
    const allComments = await Comment.find({ postId: { $in: postIds } })
      .populate('userId', 'username isVeterinarian')
      .sort({ createdAt: 1 });

    const commentsByPostId = {};
    allComments.forEach(comment => {
      const pid = comment.postId.toString();
      if (!commentsByPostId[pid]) commentsByPostId[pid] = [];
      commentsByPostId[pid].push(comment);
    });

    const postsWithComments = posts.map(post => {
      const postObject = post.toObject();
      return {
        ...postObject,
        comments: commentsByPostId[post._id.toString()] || []
      };
    });

    res.json(postsWithComments);
  } catch (error) {
    console.error('Error fetching user posts:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create post
router.post('/', auth, upload.fields([
  { name: 'images', maxCount: 20 },
  { name: 'image', maxCount: 1 },
]), async (req, res) => {
  try {
    const { caption } = req.body;

    // Sanitize caption to prevent stored XSS
    const sanitizedCaption = sanitizeHtml(caption, {
      allowedTags: [],      // Strip ALL HTML tags
      allowedAttributes: {}, // Strip ALL attributes
    });

    const files = [
      ...(req.files?.images || []),
      ...(req.files?.image || []),
    ];
    if (files.length === 0) {
      return res.status(400).json({ message: 'Image is required' });
    }

    const uploadedUrls = [];
    for (const file of files) {
      const b64 = Buffer.from(file.buffer).toString('base64');
      const dataURI = `data:${file.mimetype};base64,${b64}`;
      const uploadResponse = await cloudinary.uploader.upload(dataURI);
      uploadedUrls.push(uploadResponse.secure_url);
    }

    const post = new Post({
      userId: req.user.userId, // Ensure userId is set correctly
      caption: sanitizedCaption,
      imageUrl: uploadedUrls[0],
      imageUrls: uploadedUrls,
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
router.put('/:id', auth, upload.fields([
  { name: 'images', maxCount: 20 },
  { name: 'image', maxCount: 1 },
]), async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid post ID format' });
    }

    const update = {
      caption: sanitizeHtml(req.body.caption || '', { allowedTags: [], allowedAttributes: {} }),
    };
    const files = [
      ...(req.files?.images || []),
      ...(req.files?.image || []),
    ];

    if (files.length > 0) {
      const uploadedUrls = [];
      for (const file of files) {
        const b64 = Buffer.from(file.buffer).toString('base64');
        const dataURI = `data:${file.mimetype};base64,${b64}`;
        const uploadResponse = await cloudinary.uploader.upload(dataURI);
        uploadedUrls.push(uploadResponse.secure_url);
      }
      update.imageUrl = uploadedUrls[0];
      update.imageUrls = uploadedUrls;
    }

    const post = await Post.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      { $set: update },
      { new: true, runValidators: true }
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
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid post ID format' });
    }

    const post = await Post.findOne({
      _id: req.params.id,
      userId: req.user.userId,
    });

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const imageUrls = post.imageUrls?.length ? post.imageUrls : [post.imageUrl];
    for (const imageUrl of imageUrls.filter(Boolean)) {
      try {
        const urlPath = new URL(imageUrl).pathname;
        const uploadIndex = urlPath.indexOf('/upload/');
        if (uploadIndex !== -1) {
          const afterUpload = urlPath.substring(uploadIndex + '/upload/'.length);
          const withoutVersion = afterUpload.replace(/^v\d+\//, '');
          const publicId = withoutVersion.replace(/\.[^.]+$/, '');
          await cloudinary.uploader.destroy(publicId);
        }
      } catch (cloudErr) {
        console.error('Error deleting image from Cloudinary:', cloudErr.message);
      }
    }

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

// Like/Unlike post (atomic toggle to prevent race conditions)
router.post('/:id/like', auth, async (req, res) => {
  try {
    const postId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ message: 'Invalid post ID format' });
    }

    const userId = req.user.userId;

    // Check if user already liked the post
    const existingPost = await Post.findById(postId);
    if (!existingPost) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const alreadyLiked = existingPost.likes.includes(userId);

    // Use atomic operators to prevent race conditions
    const updatedPost = alreadyLiked
      ? await Post.findByIdAndUpdate(
        postId,
        { $pull: { likes: userId } },
        { new: true }
      ).populate('userId', 'username isVeterinarian')
      : await Post.findByIdAndUpdate(
        postId,
        { $addToSet: { likes: userId } },
        { new: true }
      ).populate('userId', 'username isVeterinarian');

    // Send notification for new like (not for unlike)
    if (!alreadyLiked && global.notificationService) {
      global.notificationService.notifyPostLike(postId, userId);
    }

    const comments = await Comment.find({ postId })
      .populate('userId', 'username isVeterinarian')
      .sort({ createdAt: 1 });

    const postObject = updatedPost.toObject();
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
