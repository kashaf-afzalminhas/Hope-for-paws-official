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

module.exports = {
  getAllUsersForAdmin,
  getUserStats,
  deleteUser,
  getAllAdoptionsForAdmin,
  getUserAdoptionsForAdmin,
  deleteAdoptionForAdmin,
}; 