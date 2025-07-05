const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getNotificationService } = require('../socket');

// Get user notifications
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const notificationService = getNotificationService();
    
    const result = await notificationService.getUserNotifications(
      req.user.userId, 
      parseInt(page), 
      parseInt(limit)
    );
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
});

// Mark notification as read
router.put('/:id/read', auth, async (req, res) => {
  try {
    const notificationService = getNotificationService();
    const notification = await notificationService.markAsRead(req.params.id, req.user.userId);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    res.json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read
router.put('/read-all', auth, async (req, res) => {
  try {
    const notificationService = getNotificationService();
    await notificationService.markAllAsRead(req.user.userId);
    
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Failed to mark all notifications as read' });
  }
});

// Delete notification
router.delete('/:id', auth, async (req, res) => {
  try {
    const notificationService = getNotificationService();
    const notification = await notificationService.deleteNotification(req.params.id, req.user.userId);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ message: 'Failed to delete notification' });
  }
});

// Get unread count
router.get('/unread-count', auth, async (req, res) => {
  try {
    const notificationService = getNotificationService();
    const result = await notificationService.getUserNotifications(req.user.userId, 1, 1);
    
    res.json({ unreadCount: result.unreadCount });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ message: 'Failed to fetch unread count' });
  }
});

module.exports = router; 