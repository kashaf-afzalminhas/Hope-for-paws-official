const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Adoption = require('../models/adoptionModel');
const AdoptionRequest = require('../models/adoptionRequestModel');
const jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary').v2;

const getAllUsersForAdmin = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ message: 'Access denied: Admins only' });
    }
    const users = await User.find({});
    const veterinarians = users.filter(u => u.isVeterinarian && !u.isAdmin);
    const regularUsers = users.filter(u => !u.isVeterinarian && !u.isAdmin);
    const admins = users.filter(u => u.isAdmin);
    res.json({ admins, veterinarians, regularUsers });
  } catch (error) {
    console.error('Error fetching users for admin:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getUserStats = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const adminUser = await User.findById(decoded.id);
    if (!adminUser || !adminUser.isAdmin) return res.status(403).json({ message: 'Admins only' });
    const { userId } = req.params;
    const [posts, comments, adoptions, requests] = await Promise.all([
      Post.countDocuments({ userId: userId }),
      Comment.countDocuments({ userId: userId }),
      Adoption.countDocuments({ userId: userId }),
      AdoptionRequest.countDocuments({ requester: userId })
    ]);
    res.json({ posts, comments, adoptions, requests });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const adminUser = await User.findById(decoded.id);
    if (!adminUser || !adminUser.isAdmin) return res.status(403).json({ message: 'Admins only' });
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const [posts, comments, adoptions, requests] = await Promise.all([
      Post.deleteMany({ user: userId }),
      Comment.deleteMany({ user: userId }),
      Adoption.deleteMany({ user: userId }),
      AdoptionRequest.deleteMany({ user: userId })
    ]);
    await User.deleteOne({ _id: userId });
    res.json({ message: 'User and related data deleted', deleted: { posts: posts.deletedCount, comments: comments.deletedCount, adoptions: adoptions.deletedCount, requests: requests.deletedCount } });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// --- Admin Adoptions Management ---
const getAllAdoptionsForAdmin = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const adminUser = await User.findById(decoded.id);
    if (!adminUser || !adminUser.isAdmin) return res.status(403).json({ message: 'Admins only' });
    const adoptions = await Adoption.find({})
      .populate('userId', 'username email')
      .sort({ createdAt: -1 });
    res.json(adoptions);
  } catch (error) {
    console.error('Error fetching all adoptions for admin:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get adoptions for a specific user (admin)
const getUserAdoptionsForAdmin = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const adminUser = await User.findById(decoded.id);
    if (!adminUser || !adminUser.isAdmin) return res.status(403).json({ message: 'Admins only' });
    const { userId } = req.params;
    const adoptions = await Adoption.find({ userId })
      .populate('userId', 'username email')
      .sort({ createdAt: -1 });
    res.json(adoptions);
  } catch (error) {
    console.error('Error fetching user adoptions for admin:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete any adoption (admin)
const deleteAdoptionForAdmin = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const adminUser = await User.findById(decoded.id);
    if (!adminUser || !adminUser.isAdmin) return res.status(403).json({ message: 'Admins only' });
    const { adoptionId } = req.params;
    const adoption = await Adoption.findById(adoptionId);
    if (!adoption) return res.status(404).json({ message: 'Adoption not found' });
    // Optionally: delete related requests
    await AdoptionRequest.deleteMany({ adId: adoptionId });
    await adoption.deleteOne();
    res.json({ message: 'Adoption deleted successfully' });
  } catch (error) {
    console.error('Error deleting adoption for admin:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all posts (admin)
const getAllPostsForAdmin = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const adminUser = await User.findById(decoded.id);
    if (!adminUser || !adminUser.isAdmin) return res.status(403).json({ message: 'Admins only' });
    const posts = await Post.find({})
      .populate('userId', 'username email')
      .sort({ createdAt: -1 });
    // Attach comments to each post
    const postsWithComments = await Promise.all(
      posts.map(async (post) => {
        const comments = await Comment.find({ postId: post._id });
        const postObject = post.toObject();
        return {
          ...postObject,
          comments: comments
        };
      })
    );
    res.json(postsWithComments);
  } catch (error) {
    console.error('Error fetching all posts for admin:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get posts for a specific user (admin)
const getUserPostsForAdmin = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const adminUser = await User.findById(decoded.id);
    if (!adminUser || !adminUser.isAdmin) return res.status(403).json({ message: 'Admins only' });
    const { userId } = req.params;
    const posts = await Post.find({ userId })
      .populate('userId', 'username email')
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    console.error('Error fetching user posts for admin:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete any post (admin)
const deletePostForAdmin = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const adminUser = await User.findById(decoded.id);
    if (!adminUser || !adminUser.isAdmin) return res.status(403).json({ message: 'Admins only' });
    const { postId } = req.params;
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    // Delete image from Cloudinary
    if (post.imageUrl) {
      const publicId = post.imageUrl.split('/').pop().split('.')[0];
      try { await cloudinary.uploader.destroy(publicId); } catch (e) { console.error('Cloudinary delete error:', e); }
    }
    // Delete all comments associated with the post
    await Comment.deleteMany({ postId: post._id });
    // Delete the post
    await post.deleteOne();
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post for admin:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all comments (admin)
const getAllCommentsForAdmin = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const adminUser = await User.findById(decoded.id);
    if (!adminUser || !adminUser.isAdmin) return res.status(403).json({ message: 'Admins only' });
    const comments = await Comment.find({})
      .populate('userId', 'username email')
      .populate('postId', 'caption imageUrl')
      .sort({ createdAt: -1 });
    res.json(comments);
  } catch (error) {
    console.error('Error fetching all comments for admin:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get comments for a specific user (admin)
const getUserCommentsForAdmin = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const adminUser = await User.findById(decoded.id);
    if (!adminUser || !adminUser.isAdmin) return res.status(403).json({ message: 'Admins only' });
    const { userId } = req.params;
    const comments = await Comment.find({ userId })
      .populate('userId', 'username email')
      .populate('postId', 'caption imageUrl')
      .sort({ createdAt: -1 });
    res.json(comments);
  } catch (error) {
    console.error('Error fetching user comments for admin:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get comments for a specific post (admin)
const getPostCommentsForAdmin = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const adminUser = await User.findById(decoded.id);
    if (!adminUser || !adminUser.isAdmin) return res.status(403).json({ message: 'Admins only' });
    const { postId } = req.params;
    const comments = await Comment.find({ postId })
      .populate('userId', 'username email')
      .populate('postId', 'caption imageUrl')
      .sort({ createdAt: -1 });
    res.json(comments);
  } catch (error) {
    console.error('Error fetching post comments for admin:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete any comment (admin)
const deleteCommentForAdmin = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const adminUser = await User.findById(decoded.id);
    if (!adminUser || !adminUser.isAdmin) return res.status(403).json({ message: 'Admins only' });
    const { commentId } = req.params;
    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    await comment.deleteOne();
    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment for admin:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all users with stats in a single request
const getAllUsersWithStats = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const adminUser = await User.findById(decoded.id);
    if (!adminUser || !adminUser.isAdmin) return res.status(403).json({ message: 'Admins only' });
    
    const users = await User.find({});
    const veterinarians = users.filter(u => u.isVeterinarian && !u.isAdmin);
    const regularUsers = users.filter(u => !u.isVeterinarian && !u.isAdmin);
    const admins = users.filter(u => u.isAdmin);
    
    // Get stats for all users in parallel
    const allUserIds = [...veterinarians, ...regularUsers, ...admins].map(u => u._id);
    
    const statsPromises = allUserIds.map(async (userId) => {
      try {
        const [posts, comments, adoptions, requests] = await Promise.all([
          Post.countDocuments({ userId: userId }),
          Comment.countDocuments({ userId: userId }),
          Adoption.countDocuments({ userId: userId }),
          AdoptionRequest.countDocuments({ requester: userId })
        ]);
        return {
          userId: userId.toString(),
          stats: { posts, comments, adoptions, requests }
        };
      } catch (error) {
        console.error(`Error fetching stats for user ${userId}:`, error);
        return {
          userId: userId.toString(),
          stats: { posts: 0, comments: 0, adoptions: 0, requests: 0 }
        };
      }
    });
    
    const userStats = await Promise.all(statsPromises);
    
    // Convert to object for easier lookup
    const statsObject = {};
    userStats.forEach(({ userId, stats }) => {
      statsObject[userId] = stats;
    });
    
    res.json({ 
      admins, 
      veterinarians, 
      regularUsers, 
      userStats: statsObject 
    });
  } catch (error) {
    console.error('Error fetching users with stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAllUsersForAdmin,
  getAllUsersWithStats,
  getUserStats,
  deleteUser,
  getAllAdoptionsForAdmin,
  getUserAdoptionsForAdmin,
  deleteAdoptionForAdmin,
  getAllPostsForAdmin,
  getUserPostsForAdmin,
  deletePostForAdmin,
  getAllCommentsForAdmin,
  getUserCommentsForAdmin,
  getPostCommentsForAdmin,
  deleteCommentForAdmin,
}; 