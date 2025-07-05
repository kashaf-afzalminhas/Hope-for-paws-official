const express = require('express');
const Comment = require('../models/Comment');
const Post = require('../models/Post');
const auth = require('../middleware/auth');
const { getNotificationService } = require('../socket');

const router = express.Router();

// Add comment to post
router.post('/:postId', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = new Comment({
      postId: req.params.postId,
      userId: req.user.userId,
      content: req.body.content,
    });

    await comment.save();
    
    const populatedComment = await Comment.findById(comment._id)
      .populate('userId', 'username isVeterinarian');

    // Send notification to post owner
    try {
      console.log('🔔 Attempting to send comment notification...');
      console.log('🔔 Post owner ID:', post.userId);
      console.log('🔔 Commenter ID:', req.user.userId);
      console.log('🔔 Commenter username:', req.user.username);
      
      const notificationService = getNotificationService();
      await notificationService.notifyPostComment(post, populatedComment, req.user);
      console.log('✅ Comment notification sent successfully');
    } catch (error) {
      console.error('❌ Error sending comment notification:', error);
    }

    res.status(201).json(populatedComment);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});


// Delete comment
router.delete('/:id', auth, async (req, res) => {
  try {
    const comment = await Comment.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId,
    });

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;