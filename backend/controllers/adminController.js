const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Adoption = require('../models/adoptionModel');
const AdoptionRequest = require('../models/adoptionRequestModel');
const jwt = require('jsonwebtoken');

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
      Post.countDocuments({ user: userId }),
      Comment.countDocuments({ user: userId }),
      Adoption.countDocuments({ user: userId }),
      AdoptionRequest.countDocuments({ user: userId })
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

module.exports = {
  getAllUsersForAdmin,
  getUserStats,
  deleteUser,
}; 