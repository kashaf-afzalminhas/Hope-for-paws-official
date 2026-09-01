const { Queue, Worker, QueueScheduler } = require('bullmq');
const Redis = require('ioredis');
const redisConfig = require('../config/redis');
const config = require('../config/notificationConfig');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const Message = require('../models/message');

const queueName = 'chat-email-reminders';
const connection = { ...redisConfig };

// Dynamic setup to support older Redis versions (like Windows 3.x) or disconnected states
let useRealQueue = false;
let realQueue = null;
let realScheduler = null;
let workerHandler = null;
const mockJobs = new Map(); // jobId -> timeoutId

const skipRedis =
  !!process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.RUNTIME === 'lambda';

if (skipRedis) {
  console.log('[Queue] Skipping Redis on Lambda — mock/in-memory mode');
} else {
  const checkClient = new Redis({
    ...connection,
    maxRetriesPerRequest: 1,
    retryStrategy: () => null // fail fast
  });

  checkClient.info('server')
    .then((info) => {
      const versionMatch = info.match(/redis_version:([0-9.]+)/);
      if (versionMatch) {
        const version = versionMatch[1];
        const majorVersion = parseInt(version.split('.')[0], 10);
        console.log(`[Queue] Detected Redis version: ${version}`);
        if (majorVersion >= 5) {
          console.log('[Queue] Redis version is compatible. Initializing BullMQ.');
          useRealQueue = true;
          realQueue = new Queue(queueName, { connection });
          realScheduler = new QueueScheduler(queueName, { connection });
          realScheduler.waitUntilReady().catch((err) => {
            console.error('[Queue] Chat email QueueScheduler failed to start:', err);
          });

          if (workerHandler && !global.realWorkerInstance) {
            global.realWorkerInstance = new Worker(
              queueName,
              workerHandler,
              { connection, concurrency: 2 }
            );
            global.realWorkerInstance.on('failed', (job, err) => {
              console.error('Chat email reminder job failed:', job?.id, err);
            });
          }
        } else {
          console.warn(`[Queue] Redis version ${version} is less than 5.0.0. BullMQ requires version >= 5.0.0. Running in Mock/In-Memory mode.`);
        }
      }
      checkClient.disconnect();
    })
    .catch((err) => {
      console.warn(`[Queue] Failed to connect to Redis or verify version: ${err.message}. Running in Mock/In-Memory mode.`);
      try { checkClient.disconnect(); } catch (e) {}
    });
}

// Proxy Queue delegation
const chatEmailQueue = new Proxy({}, {
  get(target, prop) {
    if (useRealQueue && realQueue) {
      return Reflect.get(realQueue, prop);
    }
    if (prop === 'add') {
      return async (name, data, options) => {
        console.log(`[Queue Mock] Added job: ${name}`, data, options);
        if (options && options.delay && workerHandler) {
          const jobId = options.jobId || `mock-job-${Date.now()}`;
          const delay = options.delay;
          
          if (mockJobs.has(jobId)) {
            clearTimeout(mockJobs.get(jobId));
          }
          
          const timeoutId = setTimeout(async () => {
            try {
              console.log(`[Queue Mock] Running simulated job: ${jobId}`);
              mockJobs.delete(jobId);
              await workerHandler({ data, id: jobId });
            } catch (err) {
              console.error(`[Queue Mock] Simulated job ${jobId} failed:`, err);
            }
          }, delay);
          mockJobs.set(jobId, timeoutId);
        }
        return { id: options?.jobId || 'mock-job-id' };
      };
    }
    if (prop === 'remove') {
      return async (jobId) => {
        console.log(`[Queue Mock] Removed job: ${jobId}`);
        if (mockJobs.has(jobId)) {
          clearTimeout(mockJobs.get(jobId));
          mockJobs.delete(jobId);
        }
      };
    }
    if (prop === 'getJobCounts') {
      return async () => {
        return { waiting: 0, active: 0, completed: 0, failed: 0, delayed: mockJobs.size };
      };
    }
    return () => {};
  }
});

const REMINDER_DELAY_MINUTES = config.CHAT_EMAIL_REMINDER_DELAY_MINUTES;
// Fixed: notificationConfig.js exports this as CHAT_EMAIL_ACTIVITY_GRACE_MINUTES
// (not CHAT_EMAIL_ACTIVE_GRACE_MINUTES). The old key name resolved to
// `undefined`, so toMs(ACTIVE_GRACE_MINUTES) was always NaN, and the
// "skip the reminder if the user was recently active" check below could
// never trigger — meaning someone actively chatting right now could still
// receive the reminder email once the delay elapsed.
const ACTIVE_GRACE_MINUTES = config.CHAT_EMAIL_ACTIVITY_GRACE_MINUTES;
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
      return;
    }
    console.error('Failed to schedule chat email reminder:', error);
  }
};

const rescheduleChatReminder = async (recipientId, delayMinutes) => {
  try {
    await chatEmailQueue.remove(`chat-email:${recipientId.toString()}`);
  } catch (err) {}
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
  } catch (error) {}
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

  workerHandler = async (job) => {
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
  };

  if (useRealQueue) {
    global.realWorkerInstance = new Worker(
      queueName,
      workerHandler,
      {
        connection,
        concurrency: 2
      }
    );

    global.realWorkerInstance.on('failed', (job, err) => {
      console.error('Chat email reminder job failed:', job?.id, err);
    });

    return global.realWorkerInstance;
  } else {
    console.log('[Queue Mock] Worker initialized in mock mode (Redis version < 5 or disconnected)');
    return {
      on: () => {},
      close: async () => {}
    };
  }
};

module.exports = {
  chatEmailQueue,
  scheduleChatReminder,
  cancelChatReminder,
  initChatReminderWorker
};