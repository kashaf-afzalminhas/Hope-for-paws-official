# Enhanced Chat Email Notifications System

## Overview

This enhanced notification system provides intelligent email notifications for chat messages with the following features:

- **Activity Tracking**: Tracks user online/offline status and recent activity
- **BullMQ Queue**: Uses Redis-backed delayed jobs for reliable delivery
- **Configurable Delay**: Waits a fixed interval before evaluating emails
- **Cooldown Period**: Prevents email spam with configurable cooldown windows
- **Quiet Hours**: Respects user's quiet hours (configurable time windows)
- **Digest Emails**: Sends summary emails covering multiple missed messages
- **Smart Email Logic**: Only sends emails when users are inactive and past cooldown

## Configuration

### Environment Variables

Add these to your `.env` file:

```env
# Redis connection (BullMQ)
REDIS_URL=redis://localhost:6379

# Reminder scheduling
CHAT_EMAIL_REMINDER_DELAY_MINUTES=120   # Delay before evaluating email
CHAT_EMAIL_ACTIVITY_GRACE_MINUTES=10    # How long a user is considered active
CHAT_EMAIL_EMAIL_COOLDOWN_HOURS=12      # Minimum gap between reminder emails

# Activity tracking
ACTIVITY_TIMEOUT_MINUTES=5         # How long to consider user "active" after last activity

# Quiet hours (24-hour format)
QUIET_HOURS_START=22               # 10 PM
QUIET_HOURS_END=8                  # 8 AM

# Email content
MAX_MESSAGE_PREVIEW_LENGTH=100     # Max characters in email preview
CHAT_EMAIL_PREVIEW_MESSAGE_LIMIT=5 # Number of preview messages in digest

# Debug
DEBUG_NOTIFICATIONS=false          # Enable debug logging
```

## How It Works

### 1. Message Flow
1. User sends a message (real-time web notification fires instantly)
2. System schedules a BullMQ delayed job for each recipient
3. After the delay, the worker checks:
   - Has the user been active recently?
   - Has the message been read/replied to?
   - Has an email been sent within the cooldown window?
4. If user is still inactive with unread messages, a digest email is sent

### 2. Activity Tracking
- **Online**: User has active socket connection
- **Active**: User is online AND has recent activity (within timeout)
- **Inactive**: User is offline OR no recent activity

### 3. Email Logic
- **Never send if**: User is currently active/online
- **Delay**: Wait for the configured reminder delay (default 120 minutes)
- **Cooldown**: Don't send another email for the configured cooldown (default 12 hours)
- **Quiet Hours**: Don't send emails during configured quiet hours; jobs are rescheduled
- **Digest**: Group multiple messages from different senders into a single email

### 4. Smart Features
- **Self-messages**: Never send emails for your own messages
- **Activity detection**: Real-time tracking via socket heartbeats
- **Cooldown per conversation**: Each conversation has its own cooldown
- **Digest intelligence**: Summarises multiple conversations in one email

## API Endpoints

### Get Notification Statistics
```
GET /api/notification-stats/stats
Authorization: Bearer <token>
```

Response:
```json
{
  "activity": {
    "total": 10,
    "online": 5,
    "active": 3,
    "inactive": 7
  },
  "queue": {
    "active": 0,
    "completed": 5,
    "delayed": 2,
    "failed": 0,
    "waiting": 1
  },
  "config": {
    "reminderDelayMinutes": 120,
    "activityGraceMinutes": 10,
    "emailCooldownHours": 12,
    "activityTimeoutMinutes": 5,
    "quietHoursStart": 22,
    "quietHoursEnd": 8,
    "previewMessageLimit": 5,
    "debugNotifications": false
  }
}
```

### Get User Activity Status
```
GET /api/notification-stats/activity/:userId
Authorization: Bearer <token>
```

## Socket Events

### Client → Server
- `heartbeat` - Send user heartbeat for activity tracking
- `join` - User connects (automatically tracked)
- `disconnect` - User disconnects (automatically tracked)

### Server → Client
- `newMessage` - New message received
- `messageSent` - Message sent confirmation
- `notification` - Real-time notification

## Email Templates

### Single Message Email
- Subject: "New message from [username] - Hope for Paws"
- Content: Message preview with reply button
- Link: Direct link to conversation

### Digest Email
- Subject: "You have 3 new messages - Hope for Paws"
- Content: Summary of multiple senders/conversations
- Link: Opens the chat inbox

## Best Practices

1. **Set appropriate cooldowns**: 10-15 minutes for most use cases
2. **Configure quiet hours**: Respect user's timezone and preferences
3. **Monitor activity**: Use the stats API to monitor system performance
4. **Test thoroughly**: Use debug mode to understand the flow
5. **User feedback**: Allow users to adjust notification preferences

## Troubleshooting

### Common Issues

1. **Emails not sending**
   - Check if user is active (they won't get emails if active)
   - Verify quiet hours configuration
   - Check cooldown status

2. **Too many emails**
   - Increase cooldown period
   - Ensure the reminder delay and cooldown suit your audience
   - Check activity tracking accuracy

3. **Missing emails**
   - Check if user is truly inactive
   - Verify email configuration
   - Check debug logs

### Debug Mode

Enable `DEBUG_NOTIFICATIONS=true` to see detailed logs:
- Activity tracking events
- Email sending decisions
      - Digest processing
- Cooldown status

## Performance Considerations

- **Memory usage**: Activity tracking uses in-memory storage
- **Database queries**: Minimal impact with efficient indexing
- **Email sending**: Digest email consolidates multiple notifications
- **Socket connections**: Efficient cleanup of inactive users

## Future Enhancements

- **User preferences**: Allow users to set their own quiet hours
- **Email templates**: Customizable email templates
- **Push notifications**: Mobile push notification support
- **Analytics**: Detailed notification analytics
- **A/B testing**: Test different notification strategies
