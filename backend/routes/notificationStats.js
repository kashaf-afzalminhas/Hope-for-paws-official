const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const activityTracker = require('../services/activityTracker');
const { chatEmailQueue } = require('../queues/chatEmailQueue');
const config = require('../config/notificationConfig');

// Get notification system statistics (admin only)
router.get('/stats', auth, async (req, res) => {
  try {
    // Check if user is admin (you can implement your own admin check)
    // For now, we'll allow any authenticated user to see stats
    
    const activityStats = activityTracker.getActivityStats();
    const queueCounts = await chatEmailQueue.getJobCounts();
    
    res.json({
      activity: activityStats,
      queue: queueCounts,
      config: {
        reminderDelayMinutes: config.CHAT_EMAIL_REMINDER_DELAY_MINUTES,
        activityGraceMinutes: config.CHAT_EMAIL_ACTIVITY_GRACE_MINUTES,
        emailCooldownHours: config.CHAT_EMAIL_EMAIL_COOLDOWN_HOURS,
        activityTimeoutMinutes: config.ACTIVITY_TIMEOUT_MINUTES,
        quietHoursStart: config.QUIET_HOURS_START,
        quietHoursEnd: config.QUIET_HOURS_END,
        previewMessageLimit: config.CHAT_EMAIL_PREVIEW_MESSAGE_LIMIT,
        debugNotifications: config.DEBUG_NOTIFICATIONS
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting notification stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user activity status
router.get('/activity/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const activityStatus = activityTracker.getUserActivityStatus(userId);
    
    res.json({
      userId,
      activity: activityStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting user activity:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
