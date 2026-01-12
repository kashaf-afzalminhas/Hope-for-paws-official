const { Queue, Worker, QueueScheduler } = require('bullmq');
const redisConfig = require('../config/redis');
const config = require('../config/notificationConfig');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const Message = require('../models/message');

const queueName = 'chat-email-reminders';
const connection = { ...redisConfig };

const chatEmailQueue = new Queue(queueName, { connection });
const chatEmailQueueScheduler = new QueueScheduler(queueName, { connection });
chatEmailQueueScheduler.waitUntilReady().catch((err) => {
  console.error('Chat email QueueScheduler failed to start:', err);
});

const REMINDER_DELAY_MINUTES = config.CHAT_EMAIL_REMINDER_DELAY_MINUTES;
const ACTIVE_GRACE_MINUTES = config.CHAT_EMAIL_ACTIVE_GRACE_MINUTES;
const EMAIL_COOLDOWN_HOURS = config.CHAT_EMAIL_EMAIL_COOLDOWN_HOURS;
const MAX_PREVIEW_MESSAGES = config.CHAT_EMAIL_PREVIEW_MESSAGE_LIMIT;

const toMs = (minutes) => minutes * 60 * 1000;

const scheduleChatReminder = async (recipientId) => {
  if (!recipientId) return;
  try {
    await chatEmailQueue.add(
      'chat-email-reminder',
      { recipientId: recipientId.toString() },
      {
        jobId: `chat-email:${recipientId.toString()}`,
        delay: toMs(REMINDER_DELAY_MINUTES),
        removeOnComplete: true,
        removeOnFail: true
      }
    );
  } catch (error) {
    if (error?.code === 'EJOBEXISTS') {
      // Job already queued, ignore
      return;
    }
    console.error('Failed to schedule chat email reminder:', error);
  }
};

const rescheduleChatReminder = async (recipientId, delayMinutes) => {
  try {
    await chatEmailQueue.remove(`chat-email:${recipientId.toString()}`);
  } catch (err) {
    // ignore if not existing
  }
  try {
    await chatEmailQueue.add(
      'chat-email-reminder',
      { recipientId: recipientId.toString() },
      {
        jobId: `chat-email:${recipientId.toString()}`,
        delay: toMs(delayMinutes),
        removeOnComplete: true,
        removeOnFail: true
      }
    );
  } catch (error) {
    console.error('Failed to reschedule chat email reminder:', error);
  }
};

const cancelChatReminder = async (recipientId) => {
  try {
    await chatEmailQueue.remove(`chat-email:${recipientId.toString()}`);
  } catch (error) {
    // Ignore missing jobs
  }
};

const isWithinQuietHours = () => {
  const now = new Date();
  const currentHour = now.getHours();
  const start = config.QUIET_HOURS_START;
  const end = config.QUIET_HOURS_END;

  if (start === end) return false;
  if (start < end) {
    return currentHour >= start && currentHour < end;
  }
  return currentHour >= start || currentHour < end;
};

const minutesUntilQuietHoursEnd = () => {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const endMinutes = config.QUIET_HOURS_END * 60;

  if (!isWithinQuietHours()) return 0;

  let diff = endMinutes - currentMinutes;
  if (diff <= 0) diff += 24 * 60;
  return diff;
};

const initChatReminderWorker = (notificationService) => {
  if (!notificationService) {
    throw new Error('NotificationService instance required for chat reminder worker');
  }

  const worker = new Worker(
    queueName,
    async (job) => {
      const { recipientId } = job.data;
      if (!recipientId) return { skipped: true, reason: 'missing-recipient' };

      const user = await User.findById(recipientId).lean();
      if (!user) return { skipped: true, reason: 'user-not-found' };

      const now = new Date();

      if (user.lastActive && now - user.lastActive <= toMs(ACTIVE_GRACE_MINUTES)) {
        return { skipped: true, reason: 'user-active' };
      }

      if (
        user.lastChatEmailSentAt &&
        now - user.lastChatEmailSentAt <= EMAIL_COOLDOWN_HOURS * 60 * 60 * 1000
      ) {
        return { skipped: true, reason: 'email-cooldown' };
      }

      const quietHours = isWithinQuietHours();
      if (quietHours) {
        const waitMinutes = Math.max(minutesUntilQuietHoursEnd(), 30);
        await rescheduleChatReminder(recipientId, waitMinutes);
        return { skipped: true, reason: 'quiet-hours-rescheduled', waitMinutes };
      }

      // Gather unread messages
      const conversations = await Conversation.find({ participants: recipientId })
        .select('_id participants')
        .lean();

      if (!conversations.length) {
        return { skipped: true, reason: 'no-conversations' };
      }

      const conversationIds = conversations.map((c) => c._id);

      const unreadMessages = await Message.find({
        conversationId: { $in: conversationIds },
        senderId: { $ne: recipientId },
        readBy: { $ne: recipientId }
      })
        .populate('senderId', 'username email profileImage')
        .populate('conversationId', 'participants updatedAt')
        .sort({ createdAt: 1 })
        .lean();

      if (!unreadMessages.length) {
        return { skipped: true, reason: 'no-unread' };
      }

      const uniqueSenders = new Map();
      const conversationSet = new Set();

      unreadMessages.forEach((msg) => {
        if (msg?.senderId?._id) {
          uniqueSenders.set(msg.senderId._id.toString(), msg.senderId.username || 'User');
        }
        if (msg.conversationId?._id) {
          conversationSet.add(msg.conversationId._id.toString());
        }
      });

      const previewMessages = unreadMessages.slice(0, MAX_PREVIEW_MESSAGES).map((msg) => ({
        text:
          msg.text.length > config.MAX_MESSAGE_PREVIEW_LENGTH
            ? `${msg.text.substring(0, config.MAX_MESSAGE_PREVIEW_LENGTH)}…`
            : msg.text,
        senderName: msg?.senderId?.username || 'User',
        createdAt: msg.createdAt
      }));

      const recipient = await User.findById(recipientId).lean();
      if (!recipient || !recipient.email) {
        return { skipped: true, reason: 'no-email' };
      }

      await notificationService.sendChatDigestEmail({
        recipient,
        totalMessages: unreadMessages.length,
        uniqueSenderNames: Array.from(uniqueSenders.values()),
        conversationCount: conversationSet.size,
        previewMessages
      });

      await User.findByIdAndUpdate(recipientId, {
        lastChatEmailSentAt: now
      });

      return {
        sent: true,
        messageCount: unreadMessages.length,
        senderCount: uniqueSenders.size,
        conversationCount: conversationSet.size
      };
    },
    {
      connection,
      concurrency: 2
    }
  );

  worker.on('failed', (job, err) => {
    console.error('Chat email reminder job failed:', job?.id, err);
  });

  return worker;
};

module.exports = {
  chatEmailQueue,
  scheduleChatReminder,
  cancelChatReminder,
  initChatReminderWorker
};

