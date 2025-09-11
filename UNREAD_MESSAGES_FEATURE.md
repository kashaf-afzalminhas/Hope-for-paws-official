# Unread Messages Feature Implementation

This document describes the implementation of the unread messages feature for the Hope for Paws chat application.

## Overview

The unread messages feature tracks which messages have been read by each user and displays unread message counts in the conversation list. Messages are automatically marked as read when a user opens a conversation or views messages.

## Backend Implementation

### 1. Message Model
The Message model already includes a `readBy` field that stores an array of user IDs who have read each message:

```javascript
readBy: [{
  type: mongoose.Schema.Types.ObjectId,
  ref: "User"
}]
```

### 2. Database Indexes
Added indexes for better query performance:
- `{ readBy: 1 }` - For queries filtering by read status
- `{ conversationId: 1, senderId: 1, readBy: 1 }` - For marking conversations as read

### 3. Conversation Controller Updates
Updated `getUserConversations` method to include unread message counts using MongoDB aggregation:

```javascript
const conversations = await Conversation.aggregate([
  { $match: { participants: new mongoose.Types.ObjectId(userId) } },
  {
    $lookup: {
      from: "messages",
      localField: "_id",
      foreignField: "conversationId",
      as: "messages"
    }
  },
  {
    $addFields: {
      unreadCount: {
        $size: {
          $filter: {
            input: "$messages",
            as: "msg",
            cond: {
              $and: [
                { $ne: ["$$msg.senderId", new mongoose.Types.ObjectId(userId)] },
                { $not: { $in: [new mongoose.Types.ObjectId(userId), "$$msg.readBy"] } }
              ]
            }
          }
        }
      }
    }
  }
]);
```

### 4. New API Endpoints

#### Mark Conversation as Read
- **Route**: `PATCH /messages/conversations/:conversationId/read`
- **Auth**: Required
- **Description**: Marks all unread messages in a conversation as read for the current user

#### Mark Individual Message as Read
- **Route**: `PATCH /messages/:messageId/read`
- **Auth**: Required
- **Description**: Marks a specific message as read

## Frontend Implementation

### 1. API Functions
Added new API functions in `src/Main/api.js`:
- `markConversationAsRead(conversationId)` - Marks all messages in a conversation as read
- `markMessageAsRead(messageId)` - Marks a specific message as read

### 2. Message Context Updates
Enhanced `MessageContext` with new functions:
- `updateConversationUnreadCount(conversationId, unreadCount)` - Updates unread count for a conversation
- `getTotalUnreadCount()` - Calculates total unread messages across all conversations

### 3. Component Updates

#### RecentChats Component
- Automatically marks conversations as read when selected
- Updates unread counts in real-time via socket events
- Shows unread message badges on conversation items

#### ChatWindow Component
- Marks conversation as read when opened
- Updates parent component with new unread count

#### MessageList Component
- Marks individual messages as read when viewed
- Uses API calls instead of socket emissions for reliability

#### UserCard Component
- Displays unread message count badges
- Shows "9+" for counts greater than 9

### 4. Real-time Updates
Socket events automatically update unread counts when new messages arrive:
- Only increments unread count if the conversation is not currently active
- Resets unread count to 0 when conversation is selected

## Features

### 1. Unread Message Counting
- Tracks unread messages per conversation
- Excludes messages sent by the current user
- Updates in real-time via WebSocket

### 2. Automatic Read Marking
- Messages are marked as read when conversation is opened
- Individual messages are marked as read when viewed
- Bulk marking of all messages in a conversation

### 3. Visual Indicators
- Unread message badges on conversation items
- Different styling for conversations with unread messages
- Total unread count available via context

### 4. Performance Optimizations
- Database indexes for efficient queries
- Aggregation pipeline for accurate unread counts
- Optimistic UI updates for better user experience

## Testing

A test script is provided at `backend/test-unread-messages.js` to verify the functionality:

```bash
cd backend
node test-unread-messages.js
```

The test script:
1. Creates test users and conversations
2. Sends messages between users
3. Tests the aggregation query for unread counts
4. Tests marking conversations as read
5. Verifies the results

## Usage Examples

### Marking a Conversation as Read
```javascript
import { markConversationAsRead } from '../Main/api';

// Mark all messages in a conversation as read
await markConversationAsRead(conversationId);
```

### Getting Total Unread Count
```javascript
import { useMessages } from '../context/MessageContext';

const { getTotalUnreadCount } = useMessages();
const totalUnread = getTotalUnreadCount();
```

### Updating Unread Count for a Conversation
```javascript
import { useMessages } from '../context/MessageContext';

const { updateConversationUnreadCount } = useMessages();
updateConversationUnreadCount(conversationId, 0);
```

## Future Enhancements

1. **Read Receipts**: Show when messages have been read by recipients
2. **Typing Indicators**: Show when someone is typing
3. **Message Status**: Show sent, delivered, and read status
4. **Notification Badges**: Add total unread count to navigation
5. **Bulk Actions**: Mark multiple conversations as read
6. **Read History**: Track when messages were read

## Troubleshooting

### Common Issues

1. **Unread counts not updating**: Check if the user is authenticated and the token is valid
2. **Messages not marked as read**: Verify the API endpoints are accessible and working
3. **Socket connection issues**: Check WebSocket connection and event handling
4. **Performance issues**: Ensure database indexes are created

### Debug Information

Enable debug logging by checking browser console and server logs for:
- Socket event emissions
- API request/response data
- Database query results
- Unread count calculations 