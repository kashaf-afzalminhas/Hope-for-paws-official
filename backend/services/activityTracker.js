const config = require('../config/notificationConfig');

class ActivityTracker {
  constructor() {
    this.userActivity = new Map(); // userId -> { lastSeen, isOnline, lastHeartbeat }
    this.heartbeatInterval = null;
    this.startHeartbeatCleanup();
  }

  // Track user activity when they connect
  trackUserConnect(userId) {
    const now = new Date();
    this.userActivity.set(userId.toString(), {
      lastSeen: now,
      isOnline: true,
      lastHeartbeat: now
    });
    
    if (config.DEBUG_NOTIFICATIONS) {
      console.log(`📱 User ${userId} connected - activity tracked`);
    }
  }

  // Track user activity when they disconnect
  trackUserDisconnect(userId) {
    const activity = this.userActivity.get(userId.toString());
    if (activity) {
      activity.isOnline = false;
      // Keep lastSeen timestamp for activity timeout calculation
    }
    
    if (config.DEBUG_NOTIFICATIONS) {
      console.log(`📱 User ${userId} disconnected - activity updated`);
    }
  }

  // Track user heartbeat (called when user is active)
  trackUserHeartbeat(userId) {
    const now = new Date();
    const activity = this.userActivity.get(userId.toString()) || {};
    
    this.userActivity.set(userId.toString(), {
      ...activity,
      lastSeen: now,
      isOnline: true,
      lastHeartbeat: now
    });
    
    if (config.DEBUG_NOTIFICATIONS) {
      console.log(`💓 User ${userId} heartbeat - activity updated`);
    }
  }

  // Check if user is currently active (online and recently seen)
  isUserActive(userId) {
    const activity = this.userActivity.get(userId.toString());
    if (!activity) return false;
    
    const now = new Date();
    const timeSinceLastSeen = (now - activity.lastSeen) / (1000 * 60); // minutes
    
    return activity.isOnline && timeSinceLastSeen <= config.ACTIVITY_TIMEOUT_MINUTES;
  }

  // Check if user was recently active (within activity timeout)
  wasUserRecentlyActive(userId) {
    const activity = this.userActivity.get(userId.toString());
    if (!activity) return false;
    
    const now = new Date();
    const timeSinceLastSeen = (now - activity.lastSeen) / (1000 * 60); // minutes
    
    return timeSinceLastSeen <= config.ACTIVITY_TIMEOUT_MINUTES;
  }

  // Get user activity status
  getUserActivityStatus(userId) {
    const activity = this.userActivity.get(userId.toString());
    if (!activity) {
      return {
        isOnline: false,
        lastSeen: null,
        isActive: false,
        wasRecentlyActive: false
      };
    }
    
    const now = new Date();
    const timeSinceLastSeen = (now - activity.lastSeen) / (1000 * 60); // minutes
    
    return {
      isOnline: activity.isOnline,
      lastSeen: activity.lastSeen,
      isActive: activity.isOnline && timeSinceLastSeen <= config.ACTIVITY_TIMEOUT_MINUTES,
      wasRecentlyActive: timeSinceLastSeen <= config.ACTIVITY_TIMEOUT_MINUTES
    };
  }

  // Clean up inactive users periodically
  startHeartbeatCleanup() {
    this.heartbeatInterval = setInterval(() => {
      const now = new Date();
      const timeoutMs = config.ACTIVITY_TIMEOUT_MINUTES * 60 * 1000;
      
      for (const [userId, activity] of this.userActivity.entries()) {
        const timeSinceLastHeartbeat = now - activity.lastHeartbeat;
        
        if (timeSinceLastHeartbeat > timeoutMs) {
          activity.isOnline = false;
          
          if (config.DEBUG_NOTIFICATIONS) {
            console.log(`🧹 User ${userId} marked as offline due to timeout`);
          }
        }
      }
    }, 60000); // Check every minute
  }

  // Stop cleanup interval
  stopHeartbeatCleanup() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // Get all active users
  getActiveUsers() {
    const activeUsers = [];
    for (const [userId, activity] of this.userActivity.entries()) {
      if (this.isUserActive(userId)) {
        activeUsers.push(userId);
      }
    }
    return activeUsers;
  }

  // Get activity statistics
  getActivityStats() {
    const total = this.userActivity.size;
    const online = Array.from(this.userActivity.values()).filter(a => a.isOnline).length;
    const active = this.getActiveUsers().length;
    
    return {
      total,
      online,
      active,
      inactive: total - active
    };
  }
}

// Export singleton instance
module.exports = new ActivityTracker();
