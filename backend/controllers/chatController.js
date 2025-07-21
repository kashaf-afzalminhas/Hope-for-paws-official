const Message = require('../models/message');
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
