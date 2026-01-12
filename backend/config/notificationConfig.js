// Notification configuration settings
module.exports = {
  // Reminder scheduling
  CHAT_EMAIL_REMINDER_DELAY_MINUTES: parseInt(process.env.CHAT_EMAIL_REMINDER_DELAY_MINUTES, 10) || 120,
  CHAT_EMAIL_ACTIVITY_GRACE_MINUTES: parseInt(process.env.CHAT_EMAIL_ACTIVITY_GRACE_MINUTES, 10) || 10,
  CHAT_EMAIL_EMAIL_COOLDOWN_HOURS: parseInt(process.env.CHAT_EMAIL_EMAIL_COOLDOWN_HOURS, 10) || 12,

  // Activity tracking settings
  ACTIVITY_TIMEOUT_MINUTES: parseInt(process.env.ACTIVITY_TIMEOUT_MINUTES, 10) || 5,

  // Quiet hours (24-hour format)
  QUIET_HOURS_START: parseInt(process.env.QUIET_HOURS_START, 10) || 22, // 10 PM
  QUIET_HOURS_END: parseInt(process.env.QUIET_HOURS_END, 10) || 8, // 8 AM

  // Email content settings
  MAX_MESSAGE_PREVIEW_LENGTH: parseInt(process.env.MAX_MESSAGE_PREVIEW_LENGTH, 10) || 100,
  CHAT_EMAIL_PREVIEW_MESSAGE_LIMIT: parseInt(process.env.CHAT_EMAIL_PREVIEW_MESSAGE_LIMIT, 10) || 5,

  // Debug settings
  DEBUG_NOTIFICATIONS: process.env.DEBUG_NOTIFICATIONS === 'true' || false
};
