const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Notification = require('../models/Notification');

// Debug middleware for notification routes
router.use((req, res, next) => {
  console.log(`Notification route accessed: ${req.method} ${req.path}`);
  console.log('Headers:', req.headers);
  next();
});

// Get user notifications
router.get('/', auth, async (req, res) => {
  console.log('GET /notifications - User ID:', req.user.userId);
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const notifications = await Notification.find({ recipient: req.user.userId })
      .populate('sender', 'username')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Notification.countDocuments({ recipient: req.user.userId });

    console.log(`Found ${notifications.length} notifications for user ${req.user.userId}`);

    res.json({
      notifications,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalNotifications: total,
        hasMore: skip + notifications.length < total
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get unread count
router.get('/unread-count', auth, async (req, res) => {
  console.log('GET /notifications/unread-count - User ID:', req.user.userId);
  try {
    const count = await Notification.countDocuments({
      recipient: req.user.userId,
      read: false
    });
    console.log(`Unread count for user ${req.user.userId}: ${count}`);
    res.json({ count });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark notification as read
router.put('/:id/read', auth, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user.userId },
      { read: true },
      { new: true }
    ).populate('sender', 'username');

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark all notifications as read
router.put('/mark-all-read', auth, async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.userId, read: false },
      { read: true }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete notification
router.delete('/:id', auth, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user.userId
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete all notifications
router.delete('/delete-all', auth, async (req, res) => {
  try {
    await Notification.deleteMany({ recipient: req.user.userId });
    res.json({ message: 'All notifications deleted successfully' });
  } catch (error) {
    console.error('Error deleting all notifications:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 