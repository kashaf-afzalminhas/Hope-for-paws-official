const mongoose = require('mongoose');
const Message = require('../models/message');
const Conversation = require('../models/Conversation');
const User = require('../models/User');

exports.getRecentChats = async (req, res) => {
    try {
        const userId = req.user._id;

        // Validate user ID
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        const recentChats = await Message.aggregate([
            // Only messages from conversations the user participates in
            {
                $lookup: {
                    from: "conversations",
                    localField: "conversationId",
                    foreignField: "_id",
                    as: "conversation"
                }
            },
            { $unwind: "$conversation" },
            {
                $match: {
                    "conversation.participants": userId
                }
            },
            // Sort messages by timestamp (latest first)
            { $sort: { timestamp: -1 } },
            // Group by conversation
            {
                $group: {
                    _id: "$conversationId",
                    lastMessage: { $first: "$text" },
                    timestamp: { $first: "$timestamp" },
                    conversation: { $first: "$conversation" },
                    unreadCount: {
                        $sum: {
                            $cond: [
                                { $in: [userId, "$readBy"] },
                                0,
                                1
                            ]
                        }
                    }
                }
            },
            // Get the other participant's info
            {
                $addFields: {
                    otherParticipant: {
                        $arrayElemAt: [
                            {
                                $filter: {
                                    input: "$conversation.participants",
                                    as: "participant",
                                    cond: { $ne: ["$$participant", userId] }
                                }
                            },
                            0
                        ]
                    }
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "otherParticipant",
                    foreignField: "_id",
                    as: "userInfo"
                }
            },
            { $unwind: "$userInfo" },
            {
                $project: {
                    lastMessage: 1,
                    timestamp: 1,
                    unreadCount: 1,
                    userInfo: { username: 1, email: 1 }
                }
            },
            { $sort: { timestamp: -1 } }
        ]);

        res.json({ data: recentChats });
    } catch (error) {
        console.error('Error fetching recent chats:', error);
        res.status(500).json({ error: 'Failed to fetch recent chats' });
    }
};

exports.deleteConversation = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const rawUserId = req.user?._id || req.user?.id || req.user?.userId;

        if (!rawUserId) {
            return res.status(401).json({ error: 'User authentication failed' });
        }

        if (!mongoose.Types.ObjectId.isValid(conversationId)) {
            return res.status(400).json({ error: 'Invalid conversation ID' });
        }

        const userObjectId = new mongoose.Types.ObjectId(rawUserId);

        const conversation = await Conversation.findOne({
            _id: conversationId,
            participants: userObjectId
        });

        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found or unauthorized' });
        }

        // Pull existing delete record if any, then push fresh deletion timestamp
        await Conversation.findByIdAndUpdate(
            conversationId,
            {
                $pull: { deletedBy: { userId: userObjectId } }
            },
            { new: true }
        );

        await Conversation.findByIdAndUpdate(
            conversationId,
            {
                $push: {
                    deletedBy: {
                        userId: userObjectId,
                        deletedAt: new Date()
                    }
                }
            },
            { new: true }
        );

        res.status(200).json({ success: true, message: 'Chat deleted successfully' });
    } catch (error) {
        console.error('Error deleting conversation:', error);
        res.status(500).json({ error: error.message || 'Failed to delete conversation' });
    }
};